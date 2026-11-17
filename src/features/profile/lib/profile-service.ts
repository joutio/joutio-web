import type {
  ActivityView,
  GameHistoryItemView,
  PageResponse,
} from '@joutio/client/api-types'
import { api } from '@/lib/api'

const id = encodeURIComponent

export const PROFILE_ENDPOINTS = {
  activity: (userId: string) => `/api/profiles/${id(userId)}/activity`,
  games: (userId: string) => `/api/profiles/${id(userId)}/games`,
} as const

/** Dernières parties de l'onglet Historique du Profil. */
export const RECENT_GAMES = 10

/** Progression du joueur connecté : série, badges, sujets joués, récompenses, dernières parties. */
export const profileService = {
  activity: (userId: string) => api.get<ActivityView>(PROFILE_ENDPOINTS.activity(userId)),
  recentGames: (userId: string) =>
    api.get<PageResponse<GameHistoryItemView>>(PROFILE_ENDPOINTS.games(userId), { query: { sort: 'RECENT', page: 0, size: RECENT_GAMES } }),
}
