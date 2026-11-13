import type { PageResponse, TopicCardView, TopicFacetsView, TopicSort } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'
import { topicName } from '@/shared/topics'
import type { CategoryCode } from '@/ui'

export const TOPICS_ENDPOINTS = {
  list: '/api/topics',
  facets: '/api/topics/facets',
} as const

export const PAGE_SIZE = 20

/** Page en rangées pleines : environ 20 sujets, arrondis au multiple du nombre de colonnes (`sujets.md`). */
export const pageSizeFor = (columns: number) => columns * Math.ceil(PAGE_SIZE / columns)

export type TopicFilters = {
  query: string
  /** Univers choisis ; vide = tous. */
  categories: readonly CategoryCode[]
  sort: TopicSort
  /** Uniquement les sujets suivis : `GET /api/topics?followed=true`. */
  followed?: boolean
  /** Uniquement les sujets que j'ai créés (« Mes thèmes › Mes sujets ») : `mine=true`, exclusif de `followed`. */
  mine?: boolean
  /** Écart BFF (`sujets.md` § 5) : sujets suivis retirés de chaque page côté app (une page peut compter moins de 20). */
  hideFollowed?: boolean
  /** Taille de page envoyée au BFF ; 20 par défaut. */
  size?: number
}

/** Portée « Mes thèmes » de la feuille Filtres (`sujets.md` § 2, 2026-11-13). */
export type TopicScope = 'ALL' | 'FOLLOWED' | 'MINE'

/** Tri par défaut du catalogue : « Les plus suivis ». */
export const DEFAULT_TOPIC_SORT: TopicSort = 'POPULAR'

export type TopicPage = { topics: TopicCardView[]; last: boolean }

const page = (filters: TopicFilters, category: CategoryCode | undefined, index: number) =>
  api.get<PageResponse<TopicCardView>>(TOPICS_ENDPOINTS.list, {
    query: { q: filters.query || undefined, category, followed: filters.followed || undefined, mine: filters.mine || undefined, sort: filters.sort, page: index, size: filters.size ?? PAGE_SIZE },
  })

/** Ordre d'une page fusionnée quand le tri est connu côté client ; sinon on garde l'alternance du serveur. */
const compare: Partial<Record<TopicSort, (a: TopicCardView, b: TopicCardView) => number>> = {
  POPULAR: (a, b) => b.followersCount - a.followersCount,
  ALPHA: (a, b) => topicName(a.names).localeCompare(topicName(b.names), 'fr'),
}

export const topicsService = {
  /**
   * Une page du catalogue. Écart BFF (`sujets.md` § 5) : `GET /api/topics` ne prend qu'un univers ; plusieurs
   * univers = une requête par univers, fusionnées page par page (comme le mobile).
   */
  page: async (filters: TopicFilters, index: number): Promise<TopicPage> => {
    const categories = filters.categories.length > 0 ? filters.categories : [undefined]
    const pages = await Promise.all(categories.map((category) => page(filters, category, index)))
    let topics = pages.flatMap((result) => result.content)
    const sorter = compare[filters.sort]
    if (pages.length > 1 && sorter) topics = [...topics].sort(sorter)
    if (filters.hideFollowed) topics = topics.filter((topic) => !topic.followed)
    return { topics, last: pages.every((result) => result.last) }
  },

  facets: (query: string, scope: TopicScope = 'ALL'): Promise<TopicFacetsView> =>
    api.get<TopicFacetsView>(TOPICS_ENDPOINTS.facets, {
      query: { q: query || undefined, followed: scope === 'FOLLOWED' || undefined, mine: scope === 'MINE' || undefined },
    }),
}
