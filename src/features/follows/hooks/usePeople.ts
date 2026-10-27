import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { getSessionUserId as getUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import { profilesService } from "@/features/player"
import type {
  PeopleDirection,
  PeopleParams,
} from "@/features/player/domain/profile"

/** Vues mutables (follows) : `staleTime` court + focus (cf. mut. optimistes). */
const STALE_MS = 30 * 1000
const PAGE_SIZE = 24

/**
 * Personnes (abonnements / abonnés de l'espace Social) — recherche, tri et pagination
 * serveur ; le BFF enrichit chaque carte (Elo, présence).
 */
export function usePeople(
  direction: PeopleDirection,
  params: PeopleParams = {},
  enabled = true
) {
  const userId = getUserId()
  return useQuery({
    queryKey: queryKeys.profiles.people(userId ?? "", direction, params),
    queryFn: () => profilesService.people(userId as string, direction, params),
    enabled: !!userId && enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  })
}

/** Variante **scroll infini** de `usePeople` (abonnements / abonnés), paginée côté serveur. */
export function usePeopleList(
  direction: PeopleDirection,
  params: Omit<PeopleParams, "page" | "size"> = {},
  enabled = true
) {
  const userId = getUserId()
  return useInfiniteQuery({
    queryKey: queryKeys.profiles.people(userId ?? "", direction, params),
    queryFn: ({ pageParam }) =>
      profilesService.people(userId as string, direction, {
        ...params,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.page + 1,
    enabled: !!userId && enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}
