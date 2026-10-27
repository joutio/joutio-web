import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Me } from "../domain/me"

/** Joueur courant (`GET /api/me`) : profil, progression, compteurs. */
export const meService = {
  get: (): Promise<Me> => api.get<Me>(ENDPOINTS.me),
  /** Remplace les centres d'intérêt (0 à 3 codes ordonnés, premier = univers principal). */
  updateInterests: (interests: string[]): Promise<void> =>
    api.put<void>(ENDPOINTS.meInterests, { interests }),
}
