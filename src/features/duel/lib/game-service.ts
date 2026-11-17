import type { GameChoice, GameNotification } from '@joutio/client/game'
import { api } from '@/lib/api'
import type { EventEnvelope } from '@/lib/realtime'

const id = encodeURIComponent

export const GAME_ENDPOINTS = {
  answer: (gameId: string) => `/api/games/${id(gameId)}/answer`,
  abandon: (gameId: string) => `/api/games/${id(gameId)}/abandon`,
  notifications: (gameId: string) => `/api/games/${id(gameId)}/notifications`,
  topic: (gameId: string) => `/topic/games/${gameId}`,
} as const

/** Arène : réponse, abandon, bilan et historique. La création passe par la salle. */
export const gameService = {
  /** Parties en cours du joueur (bandeau « Partie en cours »). */
  answer: (gameId: string, choice: GameChoice) => api.post<void>(GAME_ENDPOINTS.answer(gameId), { choice }),
  abandon: (gameId: string) => api.post<void>(GAME_ENDPOINTS.abandon(gameId)),
  notifications: (gameId: string) => api.get<EventEnvelope<GameNotification>[]>(GAME_ENDPOINTS.notifications(gameId)),
}
