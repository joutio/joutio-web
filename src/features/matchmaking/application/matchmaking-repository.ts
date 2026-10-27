import { matchmakingService } from "../lib/matchmaking"
import type { MatchmakingNotification } from "../domain/matchmaking-notification"
import {
  applyMatchmakingNotification,
  emptyMatchmaking,
  type Matchmaking,
} from "../domain/matchmaking"
import { NotificationStream } from "@/shared/realtime/notification-stream"

/** Stream d'une recherche d'appariement : historique REST + push STOMP. */
export function createMatchmakingStream(
  ticketId: string
): NotificationStream<MatchmakingNotification, Matchmaking> {
  return new NotificationStream<MatchmakingNotification, Matchmaking>({
    service: "matchmaking",
    aggregateId: ticketId,
    topic: `/topic/matchmaking/tickets/${ticketId}`,
    initial: emptyMatchmaking,
    load: (id) => matchmakingService.getNotifications(id),
    apply: applyMatchmakingNotification,
  })
}
