import { api } from '@/lib/api'

const id = encodeURIComponent

/** Bloquer / débloquer un joueur (`PUT` · `DELETE /api/profiles/{id}/block`), effet symétrique côté serveur. */
export const blockService = {
  block: (userId: string, block: boolean) =>
    block ? api.put<void>(`/api/profiles/${id(userId)}/block`) : api.delete<void>(`/api/profiles/${id(userId)}/block`),
}
