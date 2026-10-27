import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { progressionService } from "../lib/progression"

/** Catalogue des récompenses du joueur courant, rechargé à l'ouverture de l'onglet. */
export function useRewards() {
  return useQuery({
    queryKey: queryKeys.meRewards(),
    queryFn: progressionService.rewards,
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  })
}
