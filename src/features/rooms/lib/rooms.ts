import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { EventEnvelopeResponse } from "@/shared/types/notifications"
import type { RoomNotification } from "../domain/room-notification"
import type { IdResponse } from "@/shared/types/api"
import type { BotDifficulty } from "@/features/game/domain/game-dto"
import type { RoomView } from "../domain/room"

/** Salle (salle d'attente) : création, consultation, apparition, sortie, annulation. */
export const roomsService = {
  /** Crée une salle partagée (lien) ; le défi nominatif passe par `challengesService`. */
  create: (topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.rooms.create, { topicId }),

  /** Crée une salle contre le bot (difficulté optionnelle, défaut NORMAL). */
  createBot: (
    topicId: string,
    difficulty: BotDifficulty
  ): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.rooms.bot, { topicId, difficulty }),

  /** Salles ouvertes du joueur (défi accepté, lien partagé). */
  mine: (): Promise<RoomView[]> => api.get<RoomView[]>(ENDPOINTS.rooms.mine),

  /**
   * Apparition dans la salle (idempotent) : présence et, pour le second humain, enregistrement
   * comme participant. Pour un défi nominatif, seul l'invité y est autorisé.
   */
  join: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.join(roomId)),

  leave: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.leave(roomId)),

  cancel: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.cancel(roomId)),

  /**
   * Relance (« wizz ») de l'adversaire absent : pur temps réel, cadence 10 s côté serveur —
   * un refus métier remonte en erreur API (toast global).
   */
  wizz: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.wizz(roomId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    roomId: string
  ): Promise<EventEnvelopeResponse<RoomNotification>[]> =>
    api.get<EventEnvelopeResponse<RoomNotification>[]>(
      ENDPOINTS.rooms.notifications(roomId)
    ),
}
