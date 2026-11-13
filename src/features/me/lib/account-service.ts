import type { ReferralView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

export const ACCOUNT_ENDPOINTS = {
  birthDate: '/api/me/birth-date',
  referral: '/api/me/referral',
} as const

/** Données de compte portées par `joutio-identity` : date de naissance privée, parrainage. */
export const accountService = {
  setBirthDate: (birthDate: string) => api.put<void>(ACCOUNT_ENDPOINTS.birthDate, { birthDate }),
  referral: () => api.get<ReferralView>(ACCOUNT_ENDPOINTS.referral),
  applyReferral: (code: string) => api.put<void>(ACCOUNT_ENDPOINTS.referral, { code }),
}
