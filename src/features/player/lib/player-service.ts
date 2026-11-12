import type { HeadToHeadView, PlayerProfileView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

const id = encodeURIComponent

/** Fiche joueur, suivi et face-à-face (`/api/profiles/{id}`). */
export const playerService = {
  profile: (userId: string) => api.get<PlayerProfileView>(`/api/profiles/${id(userId)}`),
  follow: (userId: string, follow: boolean) =>
    follow ? api.put<void>(`/api/profiles/${id(userId)}/follow`) : api.delete<void>(`/api/profiles/${id(userId)}/follow`),
  /** Bilan de `userId` contre `against`. */
  headToHead: (userId: string, against: string) => api.get<HeadToHeadView>(`/api/profiles/${id(userId)}/head-to-head`, { query: { against } }),
}
