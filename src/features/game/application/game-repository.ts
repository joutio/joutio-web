import { gamesService } from "../lib/games"
import type { GameNotification } from "../domain/game-notification"
import { applyGameNotification, emptyGame } from "../domain/game-fold"
import type { GameState } from "../domain/game"
import { recordServerInstant } from "@/shared/clock/server-clock"
import { NotificationStream } from "@/shared/realtime/notification-stream"

/**
 * Fenêtre de tolérance au 404 initial : la salle redirige dès `ROOM_GAME_CREATED`, mais la
 * projection de la partie (lue pour autoriser l'historique) peut ne pas encore être matérialisée.
 * On attend jusqu'à 6 s avant de conclure que la partie n'existe pas — l'arène affiche
 * « Préparation du duel… » entre-temps.
 */
const BOOTSTRAP_GRACE_MS = 6_000
const BOOTSTRAP_RETRY_MS = 500

/** Stream d'une partie : historique REST + push STOMP `/topic/games/{gameId}`. */
export function createGameStream(
  gameId: string
): NotificationStream<GameNotification, GameState> {
  return new NotificationStream<GameNotification, GameState>({
    service: "game",
    aggregateId: gameId,
    topic: `/topic/games/${gameId}`,
    initial: emptyGame,
    load: (id) => gamesService.getNotifications(id),
    apply: applyGameNotification,
    notFoundGraceMs: BOOTSTRAP_GRACE_MS,
    notFoundRetryDelayMs: BOOTSTRAP_RETRY_MS,
    // Chaque trame live ré-ancre l'horloge sur le service game (autorité du timing).
    onLive: (envelope, receivedAt) => {
      const instant = Date.parse(envelope.timestamp)
      if (Number.isFinite(instant)) {
        recordServerInstant(instant, receivedAt)
      }
    },
  })
}
