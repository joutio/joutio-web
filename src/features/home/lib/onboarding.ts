import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Me } from "@/features/shell/domain/me"
import type { TopicCard } from "@/features/topics/domain/topic"

/** Termine (ou passe) l'onboarding côté serveur et renvoie la vue à jour. */
export const onboardingService = {
  complete: (): Promise<Me> => api.post<Me>(ENDPOINTS.onboardingComplete),

  /**
   * Recommandations pour l'onboarding à partir des intérêts en cours de saisie (avant
   * persistance). Le BFF renvoie jusqu'à 3 sujets jouables, ordonnés : premier = principal.
   */
  recommendations: (interests: string[]): Promise<TopicCard[]> =>
    api.get<TopicCard[]>(ENDPOINTS.onboardingRecommendations, {
      params: { interests: interests.join(",") },
    }),
}
