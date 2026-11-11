import type { HomeView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

export const HOME_ENDPOINTS = { home: '/api/home' } as const

export const homeService = {
  /** Rails de l'Accueil : plus joués (Top 10), nouveaux, suivis. */
  get: () => api.get<HomeView>(HOME_ENDPOINTS.home),
}
