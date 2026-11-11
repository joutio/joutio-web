import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MeView } from '@joutio/client-domain/api-types'
import { queryKeys } from '@/lib/query-keys'
import { isApiError } from '@/lib/api'
import { endSession, loginWithCode, loginRedirect, requestLoginCode } from '@/lib/session'
import { onboardingService } from '../lib/onboarding-service'

export function useRequestLoginCode() {
  return useMutation({ mutationFn: (email: string) => requestLoginCode(email) })
}

/** Vérifie le code (cookie `AUTH_TX` chez identity), puis enchaîne l'autorisation PKCE : la page quitte l'app. */
export function useLoginWithCode() {
  return useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      await loginWithCode(email, code)
      await loginRedirect()
    },
    // Compte suspendu : identity refuse le code (`403`), l'onboarding affiche l'écran dédié.
    onError: (error) => {
      if (isApiError(error) && error.statusCode === 403) void endSession('suspended')
    },
  })
}

export function useSaveInterests() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (interests: readonly string[]) => onboardingService.saveInterests(interests),
    onSuccess: (_result, interests) => client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, interests: [...interests] } : me)),
  })
}

export function useRecommendations(interests: readonly string[]) {
  return useQuery({
    queryKey: queryKeys.onboarding.recommendations(interests),
    queryFn: () => onboardingService.recommendations(interests),
    enabled: interests.length > 0,
  })
}

/** Termine l'onboarding : `me` passe à `onboardingCompleted`, la garde ouvre l'app. */
export function useCompleteOnboarding() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: onboardingService.complete,
    onSuccess: (me) => client.setQueryData(queryKeys.me, me),
  })
}
