import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { progressionService } from "../lib/progression"

/**
 * Collection de badges d'un joueur (tout le catalogue, paliers verrouillés compris).
 * Évolue lentement → `staleTime` généreux, invalidée à la fin d'un duel.
 */
export function useBadgeCollection(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.badges(userId),
    queryFn: () => progressionService.collection(userId),
    enabled: userId !== "",
    staleTime: 60 * 1000,
  })
}
