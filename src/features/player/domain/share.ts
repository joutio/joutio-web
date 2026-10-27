import type { TFunction } from "i18next"

/** Message de partage du profil d'un joueur (invitation à rejoindre Joutio). */
export function profileShareMessage(t: TFunction, name: string): string {
  return t("player.share.message", { name })
}
