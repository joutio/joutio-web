import type {
  ActivityView,
  BadgeCollectionView,
  GameHistoryItemView,
  PageResponse,
  RewardsView,
  TopicStatView,
} from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

const id = encodeURIComponent

export const PROFILE_ENDPOINTS = {
  activity: (userId: string) => `/api/profiles/${id(userId)}/activity`,
  badges: (userId: string) => `/api/profiles/${id(userId)}/badges`,
  topics: (userId: string) => `/api/profiles/${id(userId)}/topics`,
  games: (userId: string) => `/api/profiles/${id(userId)}/games`,
  rewards: '/api/me/rewards',
} as const

/** Dernières parties de l'onglet Historique du Profil. */
export const RECENT_GAMES = 10

/** Progression du joueur connecté : série, badges, sujets joués, récompenses, dernières parties. */
export const profileService = {
  activity: (userId: string) => api.get<ActivityView>(PROFILE_ENDPOINTS.activity(userId)),
  badges: (userId: string) => api.get<BadgeCollectionView>(PROFILE_ENDPOINTS.badges(userId)),
  topics: (userId: string) => api.get<TopicStatView[]>(PROFILE_ENDPOINTS.topics(userId)),
  rewards: () => api.get<RewardsView>(PROFILE_ENDPOINTS.rewards),
  recentGames: (userId: string) =>
    api.get<PageResponse<GameHistoryItemView>>(PROFILE_ENDPOINTS.games(userId), { query: { sort: 'RECENT', page: 0, size: RECENT_GAMES } }),
}
