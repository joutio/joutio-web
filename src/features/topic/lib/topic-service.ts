import type { GameHistoryItemView, PageResponse, TitlesView, TopicLeaderboardView, TopicOverviewView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

const id = encodeURIComponent

export const TOPIC_ENDPOINTS = {
  overview: (topicId: string) => `/api/topics/${id(topicId)}/overview`,
  leaderboard: (topicId: string) => `/api/topics/${id(topicId)}/leaderboard`,
  follow: (topicId: string) => `/api/topics/${id(topicId)}/follow`,
  games: (userId: string) => `/api/profiles/${id(userId)}/games`,
  titles: (userId: string) => `/api/profiles/${id(userId)}/titles`,
  title: (userId: string) => `/api/profiles/${id(userId)}/title`,
} as const

/** Top 10 de l'onglet Classement, depuis toujours et monde entier (décision du 2026-11-06, comme le mobile). */
export const BOARD_SIZE = 10
/** Dernières parties de l'onglet Parties. */
export const GAMES_SIZE = 10

export const topicService = {
  overview: (topicId: string) => api.get<TopicOverviewView>(TOPIC_ENDPOINTS.overview(topicId)),
  leaderboard: (topicId: string) =>
    api.get<TopicLeaderboardView>(TOPIC_ENDPOINTS.leaderboard(topicId), { query: { period: 'ALL_TIME', scope: 'WORLD', page: 0, size: BOARD_SIZE } }),
  /** Mes dernières parties du sujet : le BFF n'expose pas celles de tous les joueurs (`fiche-sujet.md` § 5). */
  games: (userId: string, topicId: string) =>
    api.get<PageResponse<GameHistoryItemView>>(TOPIC_ENDPOINTS.games(userId), { query: { topicId, sort: 'RECENT', page: 0, size: GAMES_SIZE } }),
  titles: (userId: string) => api.get<TitlesView>(TOPIC_ENDPOINTS.titles(userId)),
  follow: (topicId: string, follow: boolean) => (follow ? api.put<void>(TOPIC_ENDPOINTS.follow(topicId)) : api.delete<void>(TOPIC_ENDPOINTS.follow(topicId))),
  /** Porte un titre (`topicId:TIER`) ou retire le titre porté (`null`). */
  wearTitle: (userId: string, titleKey: string | null) => api.put<void>(TOPIC_ENDPOINTS.title(userId), { titleKey }),
}
