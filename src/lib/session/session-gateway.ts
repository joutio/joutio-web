import type { SessionEndReason } from './session-store'

/**
 * Pont entre l'infrastructure (client HTTP, STOMP) et le moteur de session : le client HTTP lit le jeton et demande un
 * renouvellement sans importer le moteur (pas de cycle). Le moteur s'enregistre au chargement de `session.ts`.
 */
export interface SessionGateway {
  getAccessToken: () => string | null
  /** Renouvelle (single-flight). `null` : pas de jeton utilisable (échec transitoire ou session close). */
  refresh: () => Promise<string | null>
  end: (reason: SessionEndReason) => Promise<void>
  subscribe: (listener: () => void) => () => void
}

let gateway: SessionGateway = {
  getAccessToken: () => null,
  refresh: () => Promise.resolve(null),
  end: () => Promise.resolve(),
  subscribe: () => () => {},
}

export const registerSessionGateway = (next: SessionGateway) => {
  gateway = next
}

export const sessionGateway: SessionGateway = {
  getAccessToken: () => gateway.getAccessToken(),
  refresh: () => gateway.refresh(),
  end: (reason) => gateway.end(reason),
  subscribe: (listener) => gateway.subscribe(listener),
}
