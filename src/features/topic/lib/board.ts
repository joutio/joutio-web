import type { RankingFilters } from '@joutio/client/topics'

/** Joueurs par page de « Tous les classements » (taille fixée par `@joutio/client`). */
export type BoardPeriod = 'ALL_TIME' | 'MONTHLY'
export type BoardScope = 'WORLD' | 'FOLLOWING' | 'COUNTRY'
export type BoardFilters = { period: BoardPeriod; scope: BoardScope }
export const DEFAULT_BOARD_FILTERS: BoardFilters = { period: 'ALL_TIME', scope: 'WORLD' }

/** Mois courant, `YYYY-MM` (heure locale). */
export const currentMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

/** Filtres de `useTopicBoard` : la période mensuelle porte le mois courant. */
export const rankingFilters = ({ period, scope }: BoardFilters): RankingFilters => ({ period, scope, month: period === 'MONTHLY' ? currentMonth() : undefined })

/** Dernières parties de l'onglet Parties. */
export const GAMES_SIZE = 10
