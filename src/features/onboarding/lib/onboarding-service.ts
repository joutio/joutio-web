import type { MeView } from '@joutio/client/api-types'
import { api } from '@/lib/api'

const ENDPOINTS = {
  interests: '/api/me/interests',
  complete: '/api/me/onboarding/complete',
} as const

export const onboardingService = {
  /** 0 à 3 codes d'univers, ordre conservé (premier = principal). */
  saveInterests: (interests: readonly string[]): Promise<void> => api.put<void>(ENDPOINTS.interests, { interests }),

  /** Fin ou saut de l'onboarding ; idempotent. */
  complete: (): Promise<MeView> => api.post<MeView>(ENDPOINTS.complete),
}
