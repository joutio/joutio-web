import type { PlayerTitles } from "../domain/progression"
import { equippedTitle } from "../domain/progression"
import { useTitleLabel } from "./useTitleLabel"

/**
 * Libellé du **titre porté** d'un joueur : le titre **thématique** du sujet s'il existe
 * (« Maréchal d'Empire »), sinon la composition générique « Or · Histoire ». `null` si le
 * joueur n'affiche aucun titre — l'appelant retombe alors sur le titre de compte transitoire.
 */
export function useEquippedTitleLabel(
  titles: PlayerTitles | undefined
): string | null {
  const labelOf = useTitleLabel()
  const equipped = equippedTitle(titles)

  return equipped ? labelOf(equipped) : null
}
