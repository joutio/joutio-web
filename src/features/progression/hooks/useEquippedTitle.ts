import type { PlayerTitles, UnlockedTitle } from "../domain/progression"
import { equippedTitle } from "../domain/progression"

/**
 * Titre **porté** résolu dans la liste des titres débloqués (`null` si aucun ou introuvable).
 * Le palier de rareté est déjà porté par le titre (`UnlockedTitle.tier`).
 */
export function useEquippedTitle(
  titles: PlayerTitles | undefined
): UnlockedTitle | null {
  return equippedTitle(titles)
}
