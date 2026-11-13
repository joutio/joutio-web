import type { MeView } from '@joutio/client-domain/api-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { selectStatus, useSessionStore } from '@/lib/session'
import { accountService } from '../lib/account-service'

export const REFERRAL_KEY = ['me', 'referral'] as const

/** Date de naissance privée (15 ans minimum) : `me` est mis à jour au succès, la date n'est plus exigée. */
export function useSetBirthDate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (birthDate: string) => accountService.setBirthDate(birthDate),
    onSuccess: (_result, birthDate) => {
      client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, birthDate, birthDateRequired: false } : me))
      void client.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}

/** Parrainage du joueur courant : code, filleuls, progression du badge Recruteur, parrain éventuel. */
export function useReferral() {
  const authenticated = useSessionStore(selectStatus) === 'authenticated'
  return useQuery({ queryKey: REFERRAL_KEY, queryFn: accountService.referral, enabled: authenticated, staleTime: 5 * 60_000 })
}

export function useApplyReferral() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => accountService.applyReferral(code),
    onSettled: () => void client.invalidateQueries({ queryKey: REFERRAL_KEY }),
  })
}
