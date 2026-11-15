import { api } from '@/lib/api'

export const ACCOUNT_ENDPOINTS = {
  birthDate: '/api/me/birth-date',
  terms: '/api/me/terms',
} as const

/** Données de compte portées par `joutio-identity` : date de naissance privée. */
export const accountService = {
  setBirthDate: (birthDate: string) => api.put<void>(ACCOUNT_ENDPOINTS.birthDate, { birthDate }),
  acceptTerms: (version: string) => api.put<void>(ACCOUNT_ENDPOINTS.terms, { version }),
}
