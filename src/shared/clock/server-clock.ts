/**
 * Horloge serveur partagée : offset local → serveur, ré-ancré à chaque trame temps réel.
 *
 * <p>Le seul `GET /api/clock` ne suffit pas : si la montre de l'appareil saute (mise en veille,
 * correction NTP) pendant l'attente entre deux requêtes, l'offset mémorisé devient faux et le
 * chrono/les fenêtres d'animation se désynchronisent. Chaque notification live porte
 * l'instant serveur de l'événement : on en profite pour rafraîchir l'offset en continu.</p>
 *
 * <p>L'échantillon est légèrement pessimiste (latence de transport) : le serveur paraît
 * « plus tôt » qu'il ne l'est, ce qui est le sens sûr — le chrono ne se termine jamais avant
 * l'échéance réelle.</p>
 */
type Listener = () => void

let offsetMs = 0
let sampled = false
const listeners = new Set<Listener>()

/** Ré-ancre l'horloge sur un instant serveur connu (ms epoch) reçu à `receivedAt`. */
export function recordServerInstant(
  serverEpochMs: number,
  receivedAt: number = Date.now()
): void {
  if (!Number.isFinite(serverEpochMs)) return
  offsetMs = serverEpochMs - receivedAt
  sampled = true
  listeners.forEach((listener) => listener())
}

/** Instant serveur courant estimé (ms epoch). */
export function readServerNow(): number {
  return Date.now() + offsetMs
}

/** Vrai dès qu'un échantillon serveur (clock ou trame live) a été enregistré. */
export function isServerClockSynced(): boolean {
  return sampled
}

export function subscribeServerClock(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
