import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { topicsService, type TopicFilters, type TopicScope } from '../lib/topics-service'

/** Catalogue paginé : un filtre repart de la première page, la liste affichée reste jusqu'aux nouveaux résultats. */
export function useTopics(filters: TopicFilters, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: queryKeys.topics.list(filters),
    queryFn: ({ pageParam }) => topicsService.page(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.last ? undefined : pages.length),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

/** Univers présents pour une recherche, et leurs effectifs. */
export function useTopicFacets(query: string, scope: TopicScope | boolean = 'ALL', enabled = true) {
  // `true` : sujets suivis (onglet Suivis de l'Accueil).
  const resolved: TopicScope = scope === true ? 'FOLLOWED' : scope === false ? 'ALL' : scope
  return useQuery({
    enabled,
    queryKey: queryKeys.topics.facets(query, resolved),
    queryFn: () => topicsService.facets(query, resolved),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
