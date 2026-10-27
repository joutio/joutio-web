import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { BadgeCollection, PlayerTitles } from "../domain/progression"
import type { RewardsCatalog } from "../domain/rewards"

/** Lecture de la progression d'un joueur (collection de badges, titres) et titre porté. */
export const progressionService = {
  /** Collection complète : tout le catalogue, paliers verrouillés compris. */
  collection: (userId: string): Promise<BadgeCollection> =>
    api.get<BadgeCollection>(ENDPOINTS.profiles.badges(userId)),

  /** Titres débloqués + clé du titre porté. */
  titles: (userId: string): Promise<PlayerTitles> =>
    api.get<PlayerTitles>(ENDPOINTS.profiles.titles(userId)),

  /** Catalogue des récompenses du joueur courant, verrouillées comprises. */
  rewards: (): Promise<RewardsCatalog> =>
    api.get<RewardsCatalog>(ENDPOINTS.meRewards),

  /** Titre porté (`null` retire le titre). Refusé si le palier n'est pas atteint (400). */
  equipTitle: (userId: string, titleKey: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.title(userId), { titleKey }),
}
