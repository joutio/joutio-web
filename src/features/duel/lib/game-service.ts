import type { ActiveGameView, GameChoice, GameNotification, GameResultView } from '@joutio/client-domain/game'
import { api } from '@/lib/api'
import type { EventEnvelope } from '@/lib/realtime'

const id = encodeURIComponent

export const GAME_ENDPOINTS = {
  answer: (gameId: string) => `/api/games/${id(gameId)}/answer`,
  abandon: (gameId: string) => `/api/games/${id(gameId)}/abandon`,
  result: (gameId: string) => `/api/games/${id(gameId)}/result`,
  notifications: (gameId: string) => `/api/games/${id(gameId)}/notifications`,
  topic: (gameId: string) => `/topic/games/${gameId}`,
  games: '/api/games',
} as const

/** Arène : réponse, abandon, bilan et historique. La création passe par la salle. */
export const gameService = {
  /** Parties en cours du joueur (bandeau « Partie en cours »). */
  active: () => api.get<ActiveGameView[]>(GAME_ENDPOINTS.games, { query: { active: true } }),
  answer: (gameId: string, choice: GameChoice) => api.post<void>(GAME_ENDPOINTS.answer(gameId), { choice }),
  abandon: (gameId: string) => api.post<void>(GAME_ENDPOINTS.abandon(gameId)),
  result: (gameId: string) => api.get<GameResultView>(GAME_ENDPOINTS.result(gameId)),
  notifications: (gameId: string) => api.get<EventEnvelope<GameNotification>[]>(GAME_ENDPOINTS.notifications(gameId)),
}
