import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { challengesService } from "../lib/challenges"

/** Vue mutable (défis en attente) : rafraîchissement périodique + tolérance alignée. */
const CHALLENGES_POLL_MS = 15_000

/**
 * Défis nominatifs en attente où le joueur est lanceur ou invité (bannière d'accueil).
 * Rafraîchi périodiquement : l'acceptation/le refus arrive par notification dans l'intervalle.
 */
export function useMyChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges.mine(),
    queryFn: () => challengesService.mine(),
    staleTime: CHALLENGES_POLL_MS,
    refetchInterval: CHALLENGES_POLL_MS,
  })
}
