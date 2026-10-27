import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { topicsService } from "../lib/topics"
import type { TopicFacetsParams, TopicListParams } from "../domain/topic"

const LIST_STALE_MS = 5 * 60 * 1000
const CATEGORIES_STALE_MS = 60 * 60 * 1000
const PAGE_SIZE = 24

/** Catalogue paginé (scroll infini) : recherche, facettes, tri et filtre « suivis » côté BFF. */
export function useTopicsList(params: Omit<TopicListParams, "page" | "size">) {
  return useInfiniteQuery({
    queryKey: queryKeys.topics.list(params),
    queryFn: ({ pageParam }) =>
      topicsService.list({ ...params, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.page + 1,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  })
}

/**
 * Facettes du catalogue (total + compteurs par catégorie) pour les filtres courants.
 * Toujours activées : même en mode « Mes sujets » (où `q`/`followed` sont vidés), la liste de
 * catégories reste choisissable — son usage quitte le mode « Mes sujets » (exclusif côté BFF).
 */
export function useTopicFacets(params: TopicFacetsParams) {
  return useQuery({
    queryKey: queryKeys.topics.facets(params),
    queryFn: () => topicsService.facets(params),
    staleTime: LIST_STALE_MS,
    placeholderData: (previous) => previous,
  })
}

/** Catégories exposées par le BFF (nom + libellé FR). */
export function useTopicCategories() {
  return useQuery({
    queryKey: queryKeys.topics.categories(),
    queryFn: () => topicsService.categories(),
    staleTime: CATEGORIES_STALE_MS,
  })
}
