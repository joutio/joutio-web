import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { EventEnvelopeResponse } from "@/shared/types/notifications"
import type { MatchmakingNotification } from "../domain/matchmaking-notification"
import type { MatchmakingTicket } from "../domain/matchmaking"

/** Appariement public : enqueue, annulation, historique. */
export const matchmakingService = {
  enqueue: (topicId: string): Promise<MatchmakingTicket> =>
    api.post<MatchmakingTicket>(ENDPOINTS.matchmaking.tickets, { topicId }),

  cancel: (ticketId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.matchmaking.cancel(ticketId)),

  getNotifications: (
    ticketId: string
  ): Promise<EventEnvelopeResponse<MatchmakingNotification>[]> =>
    api.get<EventEnvelopeResponse<MatchmakingNotification>[]>(
      ENDPOINTS.matchmaking.notifications(ticketId)
    ),
}
