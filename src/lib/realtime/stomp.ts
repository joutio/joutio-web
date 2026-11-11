import { Client, ReconnectionTimeMode, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { create } from 'zustand'
import { config } from '../config'
import { sessionGateway } from '../session/session-gateway'

/**
 * Connexion STOMP unique au BFF (`/ws`, transport WebSocket brut), JWT au `CONNECT`, reconnexion à délai croissant.
 * Les abonnements partagent le client ; à chaque (re)connexion ils sont rétablis et leur `onConnect` rappelé (les
 * flux rejouent alors l'historique REST pour combler la coupure). Fermée quand l'onglet est masqué (présence), rouverte
 * à son retour. L'état alimente la bande `Banner` `connection` (`GlobalBannerContext`).
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline'

type ConnectionState = {
  status: ConnectionStatus
  lostAt: number | null
  /** Instant du dernier retour en ligne après une perte (bande « Connexion rétablie »). */
  restoredAt: number | null
}

export const useConnectionStore = create<ConnectionState>(() => ({
  status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'idle',
  lostAt: null,
  restoredAt: null,
}))

function setStatus(status: ConnectionStatus) {
  const current = useConnectionStore.getState()
  if (current.status === status) return
  const lost = status === 'reconnecting' || status === 'offline'
  useConnectionStore.setState({
    status,
    lostAt: lost ? (current.lostAt ?? Date.now()) : status === 'online' ? null : current.lostAt,
    restoredAt: status === 'online' && current.lostAt != null ? Date.now() : current.restoredAt,
  })
}

type Handler = (message: IMessage) => void

const destinations = new Map<string, Set<Handler>>()
const connectHandlers = new Map<string, Set<() => void>>()
const brokerSubscriptions = new Map<string, StompSubscription>()
let wanted = false
let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
let everConnected = false
let retained = 0
let deactivating: Promise<void> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null

const client = new Client({
  webSocketFactory: () => new WebSocket(config.wsUrl),
  reconnectDelay: 1000,
  reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
  maxReconnectDelay: 5000,
  heartbeatIncoming: 10_000,
  heartbeatOutgoing: 10_000,
  debug: () => undefined,
  beforeConnect: () => {
    setStatus(navigator.onLine === false ? 'offline' : everConnected ? 'reconnecting' : 'connecting')
    const token = sessionGateway.getAccessToken()
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
  },
})

const brokerSubscribe = (destination: string) =>
  brokerSubscriptions.set(
    destination,
    client.subscribe(destination, (message) => destinations.get(destination)?.forEach((handler) => handler(message))),
  )

client.onConnect = () => {
  everConnected = true
  setStatus('online')
  brokerSubscriptions.clear()
  destinations.forEach((_handlers, destination) => brokerSubscribe(destination))
  connectHandlers.forEach((handlers) => handlers.forEach((onConnect) => onConnect()))
}

const onLost = () => {
  brokerSubscriptions.clear()
  if (wanted && !hidden) setStatus(navigator.onLine === false ? 'offline' : 'reconnecting')
}
client.onWebSocketClose = onLost
// Refus du broker (jeton expiré) : la reconnexion relira le jeton courant, renouvelé entre-temps.
client.onStompError = onLost

function stop() {
  if (!client.active) return
  deactivating = client.deactivate().finally(() => {
    deactivating = null
  })
}

function start() {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  wanted = true
  if (hidden || !sessionGateway.getAccessToken()) return
  if (deactivating) {
    void deactivating.then(() => {
      if (wanted && !hidden && !client.active) client.activate()
    })
    return
  }
  if (!client.active) client.activate()
}

/** Délai avant de fermer une connexion sans abonnement : l'écran suivant se réabonne entre-temps. */
const IDLE_GRACE_MS = 3000

function stopIfIdle() {
  if (destinations.size > 0 || retained > 0 || !wanted || idleTimer) return
  idleTimer = setTimeout(() => {
    idleTimer = null
    if (destinations.size > 0 || retained > 0) return
    wanted = false
    everConnected = false
    setStatus('idle')
    stop()
  }, IDLE_GRACE_MS)
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    hidden = document.visibilityState === 'hidden'
    if (hidden) stop()
    else if (wanted) start()
  })
  window.addEventListener('offline', () => wanted && setStatus('offline'))
  window.addEventListener('online', () => {
    if (!wanted) return
    setStatus('reconnecting')
    void reconnectStomp()
  })
  // Connexion ou rotation de jeton : on (re)connecte avec le nouveau JWT ; déconnexion : on ferme.
  sessionGateway.subscribe(() => {
    if (!sessionGateway.getAccessToken()) {
      stop()
      setStatus('idle')
    } else if (wanted && !client.active) start()
  })
}

/** « Réessayer » : coupe la tentative en cours et repart tout de suite, sans attendre le délai exponentiel. */
export async function reconnectStomp(): Promise<void> {
  if (!wanted || hidden || client.connected) return
  await (deactivating ?? client.deactivate())
  if (wanted && !hidden && !client.active) client.activate()
}

/**
 * Abonne `handler` à une destination ; `onConnect` est rappelé à chaque (re)connexion, et tout de suite si la connexion
 * est déjà établie. Renvoie la fonction de désabonnement.
 */
export function subscribeStomp(destination: string, handler: Handler, onConnect?: () => void): () => void {
  const handlers = destinations.get(destination) ?? new Set<Handler>()
  destinations.set(destination, handlers)
  handlers.add(handler)
  if (onConnect) {
    const set = connectHandlers.get(destination) ?? new Set<() => void>()
    connectHandlers.set(destination, set)
    set.add(onConnect)
  }

  if (client.connected) {
    if (!brokerSubscriptions.has(destination)) brokerSubscribe(destination)
    onConnect?.()
  } else start()

  return () => {
    handlers.delete(handler)
    if (handlers.size === 0) {
      destinations.delete(destination)
      brokerSubscriptions.get(destination)?.unsubscribe()
      brokerSubscriptions.delete(destination)
    }
    if (onConnect) {
      const set = connectHandlers.get(destination)
      set?.delete(onConnect)
      if (set?.size === 0) connectHandlers.delete(destination)
    }
    stopIfIdle()
  }
}

/** Garde la connexion ouverte sans abonnement (présence en ligne). Renvoie la libération. */
export function retainStompConnection(): () => void {
  retained += 1
  start()
  let released = false
  return () => {
    if (released) return
    released = true
    retained = Math.max(0, retained - 1)
    stopIfIdle()
  }
}
