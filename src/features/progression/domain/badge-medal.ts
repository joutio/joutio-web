/**
 * Géométrie et encres des **sceaux de badges** (`src/assets/badge/badge-*.svg`, copies de
 * `product/badge`).
 *
 * <p>Les sept assets partagent le même repère `300 × 330` : le sceau festonné occupe le haut,
 * les queues de ruban débordent vers le bas. Le picto (emblème de famille ou d'exploit) se pose
 * au centre du disque, dans un carré vide de `104 × 104` unités — les copies web ne contiennent
 * volontairement aucun picto baké.</p>
 *
 * <p>Toutes les mesures sont exprimées dans le repère de l'asset, donc indépendantes de la
 * taille d'affichage : l'overlay React se positionne en pourcentages.</p>
 */

import type { BadgeTier } from "./progression"

/** `viewBox` commun des sceaux de `product/badge`. */
export const BADGE_MEDAL_VIEWBOX = "0 0 300 330"

/** Largeur du repère de l'asset. */
export const BADGE_MEDAL_WIDTH = 300

/** Hauteur du repère de l'asset (sceau + queues de ruban). */
export const BADGE_MEDAL_HEIGHT = 330

/** Emplacement central vide des assets, dans le repère du sceau. */
export const BADGE_MEDAL_SLOT = {
  centerX: 150,
  centerY: 150,
  size: 104,
} as const

/** Largeur du picto en fraction de la largeur du sceau (`104 / 300`). */
export const BADGE_SLOT_WIDTH_RATIO = BADGE_MEDAL_SLOT.size / BADGE_MEDAL_WIDTH

/** Position verticale relative du centre du picto (`150 / 330`). */
export const BADGE_SLOT_CENTER_Y_RATIO =
  BADGE_MEDAL_SLOT.centerY / BADGE_MEDAL_HEIGHT

/**
 * Encre du picto central par palier : couples relevés dans les palettes d'assets (le disque
 * métallique est clair, l'encre est donc **sombre** — même logique que le texte des rubans).
 * Le blanc est réservé au liseré de profondeur de l'overlay.
 */
export const BADGE_PICTO_INK: Record<BadgeTier, string> = {
  FER: "#101215",
  BRONZE: "#35190a",
  ARGENT: "#262b34",
  OR: "#4a2f00",
  PLATINE: "#1a2342",
  EMERAUDE: "#04281a",
  DIAMANT: "#0a2a44",
}

/** Encre du picto d'un palier, avec repli **bronze** pour un palier inconnu du web. */
export function badgePictoInkOf(tier: string): string {
  return BADGE_PICTO_INK[tier as BadgeTier] ?? BADGE_PICTO_INK.BRONZE
}
