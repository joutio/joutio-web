import type { MeView, TopicCardView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

const ENDPOINTS = {
  interests: '/api/me/interests',
  recommendations: '/api/me/onboarding/recommendations',
  complete: '/api/me/onboarding/complete',
} as const

export const onboardingService = {
  /** 0 à 3 codes d'univers, ordre conservé (premier = principal). */
  saveInterests: (interests: readonly string[]): Promise<void> => api.put<void>(ENDPOINTS.interests, { interests }),

  /** Sujets publiés et jouables pour les univers choisis, avant persistance. */
  recommendations: (interests: readonly string[]): Promise<TopicCardView[]> =>
    api.get<TopicCardView[]>(ENDPOINTS.recommendations, { query: { interests: interests.join(',') } }),

  /** Fin ou saut de l'onboarding ; idempotent. */
  complete: (): Promise<MeView> => api.post<MeView>(ENDPOINTS.complete),
}
