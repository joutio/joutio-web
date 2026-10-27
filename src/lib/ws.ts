import { Client, ReconnectionTimeMode, type IMessage } from "@stomp/stompjs"
import { sessionGateway } from "./session"
import { config } from "./config"

/**
 * Base WebSocket dérivée de l'URL du BFF (`http(s)://host` → `ws(s)://host`).
 * Le BFF expose **un seul** endpoint STOMP `/ws` ; on utilise le transport WebSocket brut
 * `/ws/websocket`.
 */
function wsBase(): string {
  return config.apiUrl.replace(/^http/, "ws")
}

/** Clé unique : le BFF centralise tous les topics sur une seule connexion. */
const CONNECTION_KEY = "bff"

function connectHeaders(): Record<string, string> {
  const token = sessionGateway.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type MessageHandler = (message: IMessage) => void

interface BrokerSubscription {
  unsubscribe: () => void
}

/**
 * Une connexion STOMP mutualisée par service : plusieurs abonnements (et une rétention
 * « à vide » pour la présence) partagent le même client, reconstruit automatiquement à la
 * reconnexion.
 */
interface ServiceConnection {
  client: Client
  destinations: Map<string, Set<MessageHandler>>
  onConnectHandlers: Map<string, Set<() => void>>
  brokerSubscriptions: Map<string, BrokerSubscription>
  retained: number
  active: boolean
  /** Suspendue : l'onglet n'est plus visible, la connexion est fermée proprement. */
  suspended: boolean
}

const connections = new Map<string, ServiceConnection>()

// Un refresh de token (ou un changement de session) peut avoir fait fermer une connexion
// (token expiré) : on relance celles qui sont censées rester actives mais sont déconnectées.
sessionGateway.subscribe(() => {
  connections.forEach((connection) => {
    if (
      connection.active &&
      !connection.suspended &&
      !connection.client.connected &&
      !connection.client.active
    ) {
      connection.client.activate()
    }
  })
})

/**
 * Présence « hors ligne si non visible » : dès que l'onglet/PWA est masqué ou déchargé, on ferme
 * proprement la connexion STOMP (DISCONNECT) sans perdre les abonnements. Le BFF voit une
 * déconnexion de session, la grâce de 15 s absorbe les bascules rapides d'onglet. À la
 * réapparition, la connexion est relancée et `onConnect` re-souscrit toutes les destinations.
 */
function suspendConnections(): void {
  connections.forEach((connection) => {
    connection.suspended = true
    if (connection.client.active) {
      void connection.client.deactivate()
    }
  })
}

function resumeConnections(): void {
  connections.forEach((connection) => {
    connection.suspended = false
    if (connection.active && !connection.client.active) {
      connection.client.activate()
    }
  })
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      suspendConnections()
    } else {
      resumeConnections()
    }
  })
  window.addEventListener("pagehide", suspendConnections)
  window.addEventListener("pageshow", resumeConnections)
}

function brokerSubscribe(
  connection: ServiceConnection,
  destination: string
): void {
  const subscription = connection.client.subscribe(destination, (message) => {
    connection.destinations
      .get(destination)
      ?.forEach((handler) => handler(message))
  })
  connection.brokerSubscriptions.set(destination, subscription)
}

function ensureConnection(): ServiceConnection {
  const existing = connections.get(CONNECTION_KEY)
  if (existing) {
    return existing
  }

  const connection: ServiceConnection = {
    client: undefined as unknown as Client,
    destinations: new Map(),
    onConnectHandlers: new Map(),
    brokerSubscriptions: new Map(),
    retained: 0,
    active: false,
    suspended: false,
  }

  const client = new Client({
    webSocketFactory: () => new WebSocket(`${wsBase()}/ws/websocket`),
    // Reconnexion avec backoff exponentiel (1s → 30s max).
    reconnectDelay: 1000,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: 30000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
    beforeConnect: () => {
      // Relit le token à chaque (re)connexion : après un refresh, la connexion suivante
      // présente l'access token à jour.
      client.connectHeaders = connectHeaders()
    },
  })

  client.onConnect = () => {
    connection.brokerSubscriptions.forEach((sub) => sub.unsubscribe())
    connection.brokerSubscriptions.clear()
    connection.destinations.forEach((_handlers, destination) =>
      brokerSubscribe(connection, destination)
    )
    connection.onConnectHandlers.forEach((handlers) =>
      handlers.forEach((onConnect) => onConnect())
    )
  }
  client.onWebSocketClose = () => {
    connection.brokerSubscriptions.clear()
  }

  connection.client = client
  connections.set(CONNECTION_KEY, connection)
  return connection
}

function activate(connection: ServiceConnection): void {
  connection.active = true
  if (!connection.suspended) {
    connection.client.activate()
  }
}

function deactivateIfIdle(connection: ServiceConnection): void {
  if (
    connection.destinations.size === 0 &&
    connection.retained === 0 &&
    connection.active
  ) {
    connection.active = false
    connections.delete(CONNECTION_KEY)
    void connection.client.deactivate()
  }
}

/** Abonne un handler à une destination STOMP (connexion mutualisée par service). */
export function subscribeStomp(
  _service: string,
  destination: string,
  handler: MessageHandler,
  onConnect?: () => void
): () => void {
  const connection = ensureConnection()

  let handlers = connection.destinations.get(destination)
  if (!handlers) {
    handlers = new Set()
    connection.destinations.set(destination, handlers)
  }
  handlers.add(handler)

  if (onConnect) {
    let connectHandlers = connection.onConnectHandlers.get(destination)
    if (!connectHandlers) {
      connectHandlers = new Set()
      connection.onConnectHandlers.set(destination, connectHandlers)
    }
    connectHandlers.add(onConnect)
  }

  if (connection.client.connected) {
    if (!connection.brokerSubscriptions.has(destination)) {
      brokerSubscribe(connection, destination)
    }
    onConnect?.()
  } else {
    activate(connection)
  }

  return () => {
    const current = connection.destinations.get(destination)
    if (current) {
      current.delete(handler)
      if (current.size === 0) {
        connection.destinations.delete(destination)
        connection.brokerSubscriptions.get(destination)?.unsubscribe()
        connection.brokerSubscriptions.delete(destination)
      }
    }
    if (onConnect) {
      const connectHandlers = connection.onConnectHandlers.get(destination)
      connectHandlers?.delete(onConnect)
      if (connectHandlers && connectHandlers.size === 0) {
        connection.onConnectHandlers.delete(destination)
      }
    }
    deactivateIfIdle(connection)
  }
}

/**
 * Maintient la connexion unique au BFF active sans abonnement — pour la présence, où le
 * `CONNECT` authentifié est lui-même le signal. Retourne la fonction de libération.
 */
export function retainStompConnection(_service: string): () => void {
  const connection = ensureConnection()
  connection.retained += 1
  activate(connection)

  let released = false
  return () => {
    if (released) {
      return
    }
    released = true
    connection.retained = Math.max(0, connection.retained - 1)
    deactivateIfIdle(connection)
  }
}

export type { IMessage }
