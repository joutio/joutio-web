/**
 * Contrat d'infrastructure de session : la couche `lib` (client HTTP, WebSocket) ne
 * connaît pas la feature `auth`. Celle-ci enregistre un `SessionGateway` au démarrage
 * (`registerSessionGateway`), ce qui évite toute dépendance `lib → features`.
 */
export interface SessionGateway {
  /** Access token courant (null si non authentifié). */
  getAccessToken: () => string | null
  /** Renouvelle la session et retourne le nouvel access token (null si échec). */
  refresh: () => Promise<string | null>
  /** Purge la session localement, sans révocation serveur (401 / renew définitif). */
  clear: () => Promise<void>
  /** Notifie à chaque changement de session/token (permet de rafraîchir les WS). */
  subscribe: (listener: () => void) => () => void
}

const unregisteredGateway: SessionGateway = {
  getAccessToken: () => null,
  refresh: async () => null,
  clear: async () => undefined,
  subscribe: () => () => undefined,
}

let gateway: SessionGateway = unregisteredGateway

/** Enregistre l'implémentation fournie par la feature `auth` (appelée au bootstrap). */
export function registerSessionGateway(next: SessionGateway): void {
  gateway = next
}

export const sessionGateway: SessionGateway = {
  getAccessToken: () => gateway.getAccessToken(),
  refresh: () => gateway.refresh(),
  clear: () => gateway.clear(),
  subscribe: (listener) => gateway.subscribe(listener),
}
