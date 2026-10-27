import { useQuery } from "@tanstack/react-query"
import { getSessionUserId as getUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import { homeService } from "../lib/home"

const STALE_MS = 5 * 60 * 1000

/** Accueil : Top 10, suivis récents, nouveautés puis « Pour toi », composés par le BFF. */
export function useHome() {
  const userId = getUserId()
  return useQuery({
    queryKey: queryKeys.home(),
    queryFn: () => homeService.get(),
    enabled: !!userId,
    staleTime: STALE_MS,
  })
}
