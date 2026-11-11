import type { ActivityView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

export const PROFILE_ENDPOINTS = {
  activity: (userId: string) => `/api/profiles/${encodeURIComponent(userId)}/activity`,
} as const

export const profileService = {
  activity: (userId: string) => api.get<ActivityView>(PROFILE_ENDPOINTS.activity(userId)),
}
