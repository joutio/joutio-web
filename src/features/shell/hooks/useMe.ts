import { useQuery } from "@tanstack/react-query"
import { getSessionUserId as getUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import { meService } from "../lib/me"

/** Vue mutable (compteurs de follows, progression) : `staleTime` court + focus (cf. mut. optimistes). */
const STALE_MS = 30 * 1000

/**
 * Joueur courant (`GET /api/me`) : profil + progression + compteurs d'abonnements et de
 * défis en attente. Remplace le fan-out profil + progression + badge côté client.
 */
export function useMe() {
  const userId = getUserId()
  const query = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => meService.get(),
    enabled: !!userId,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
  return { ...query, userId }
}
