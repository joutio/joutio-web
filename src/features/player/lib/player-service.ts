import { api } from '@/lib/api'

const id = encodeURIComponent

/** Fiche joueur, suivi et face-à-face (`/api/profiles/{id}`). */
export const playerService = {
  follow: (userId: string, follow: boolean) =>
    follow ? api.put<void>(`/api/profiles/${id(userId)}/follow`) : api.delete<void>(`/api/profiles/${id(userId)}/follow`),
}
