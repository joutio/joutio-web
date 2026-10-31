import { hashString } from "@/lib/helpers"

const AVATAR_COLORS = [
  "#46C6CD",
  "#79B6F4",
  "#C79DE6",
  "#E694BB",
  "#ED997B",
  "#A1BD6E",
  "#BBB55E",
]

/** Couleur d'avatar stable dérivée de l'identifiant joueur. */
export function personColor(userId: string): string {
  return AVATAR_COLORS[hashString(userId) % AVATAR_COLORS.length]
}
