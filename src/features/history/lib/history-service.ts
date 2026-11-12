import type { GameHistoryItemView, PageResponse } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

/** 20 parties par page (`historique.md` § 5). */
export const HISTORY_PAGE_SIZE = 20

export type HistoryOpponentType = 'HUMAN' | 'BOT'
export type HistoryOutcome = 'ALL' | 'WIN' | 'LOSS' | 'DRAW'
export type HistorySort = 'RECENT' | 'OLDEST'

export type HistoryFilters = {
  topicId?: string
  opponentId?: string
  opponentType?: HistoryOpponentType
  outcome: HistoryOutcome
  sort: HistorySort
}

export type HistoryFilterState = Pick<HistoryFilters, 'opponentType' | 'outcome' | 'sort'>

export const DEFAULT_HISTORY_FILTERS: HistoryFilterState = { outcome: 'ALL', sort: 'RECENT' }

/** Parties d'un joueur, filtrées et paginées (`GET /api/profiles/{userId}/games`). */
export const historyService = {
  page: (userId: string, filters: HistoryFilters, page: number) =>
    api.get<PageResponse<GameHistoryItemView>>(`/api/profiles/${encodeURIComponent(userId)}/games`, {
      query: {
        topicId: filters.topicId,
        opponentId: filters.opponentId,
        opponentType: filters.opponentType,
        outcome: filters.outcome,
        sort: filters.sort,
        page,
        size: HISTORY_PAGE_SIZE,
      },
    }),
}
