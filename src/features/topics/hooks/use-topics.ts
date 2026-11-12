import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { topicsService, type TopicFilters } from '../lib/topics-service'

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
export function useTopicFacets(query: string, followed = false, enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.topics.facets(query, followed),
    queryFn: () => topicsService.facets(query, followed),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
