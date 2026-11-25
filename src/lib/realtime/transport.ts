import type { RealtimeTransport } from '@joutio/client/core'
import { recordServerInstant } from './server-clock'
import { subscribeStomp } from './stomp'

/** Horodatage serveur d'une trame d'agrégat (`EventEnvelope` : partie, salle, ticket) ; `null` pour les autres. */
function envelopeInstant(body: string): number | null {
  try {
    const frame = JSON.parse(body) as { sequenceNumber?: unknown; timestamp?: unknown }
    if (typeof frame.sequenceNumber !== 'number' || typeof frame.timestamp !== 'string') return null
    const instant = Date.parse(frame.timestamp)
    return Number.isNaN(instant) ? null : instant
  } catch {
    return null
  }
}

/**
 * `RealtimeTransport` de `@joutio/client` sur la connexion STOMP unique. Chaque trame d'agrégat reçue ré-ancre
 * l'horloge serveur (borne basse du décalage) avant d'être remise à la lib.
 */
export const realtime: RealtimeTransport = {
  subscribe: (destination, onMessage, onConnect) =>
    subscribeStomp(
      destination,
      (message) => {
        const receivedAt = Date.now()
        const instant = envelopeInstant(message.body)
        if (instant !== null) recordServerInstant(instant, receivedAt)
        onMessage({ body: message.body })
      },
      onConnect,
    ),
}
