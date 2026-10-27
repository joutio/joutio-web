import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { onboardingService } from "../lib/onboarding"

const STALE_MS = 60 * 1000

/**
 * Recommandations de l'onboarding à partir des univers choisis (avant persistance du profil).
 * Désactivé sans intérêt ; les changements d'univers relancent la requête.
 */
export function useOnboardingRecommendations(interests: string[]) {
  return useQuery({
    queryKey: queryKeys.onboarding.recommendations(interests),
    queryFn: () => onboardingService.recommendations(interests),
    enabled: interests.length > 0,
    staleTime: STALE_MS,
  })
}
