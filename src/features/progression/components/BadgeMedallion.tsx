import { createElement } from "react"
import { cn } from "cn"
import badgeArgentUrl from "@/assets/badge/badge-argent.svg"
import badgeBronzeUrl from "@/assets/badge/badge-bronze.svg"
import badgeDiamantUrl from "@/assets/badge/badge-diamant.svg"
import badgeEmeraudeUrl from "@/assets/badge/badge-emeraude.svg"
import badgeFerUrl from "@/assets/badge/badge-fer.svg"
import badgeOrUrl from "@/assets/badge/badge-or.svg"
import badgePlatineUrl from "@/assets/badge/badge-platine.svg"
import {
  BADGE_SLOT_CENTER_Y_RATIO,
  BADGE_SLOT_WIDTH_RATIO,
  badgePictoInkOf,
} from "../domain/badge-medal"
import type { BadgeFamily, BadgeTier } from "../domain/progression"
import { badgeIcon } from "./family-icon"
import { LOCKED_VISUAL_CLASS } from "./locked-visuals"

/** Sceaux de `product/badge` : un métal par palier, emplacement central vide pour le picto. */
const BADGE_ASSETS: Record<BadgeTier, string> = {
  FER: badgeFerUrl,
  BRONZE: badgeBronzeUrl,
  ARGENT: badgeArgentUrl,
  OR: badgeOrUrl,
  PLATINE: badgePlatineUrl,
  EMERAUDE: badgeEmeraudeUrl,
  DIAMANT: badgeDiamantUrl,
}

interface BadgeMedallionProps {
  family: BadgeFamily
  tier: BadgeTier
  /** Code du badge : les exploits ponctuels portent leur **propre** emblème. */
  code?: string
  /**
   * Verrouillé : sceau **atténué et désaturé**, comme l'aperçu d'une récompense verrouillée.
   * Acquis, le métal reste en pleine couleur.
   */
  locked?: boolean
  /** Largeur du sceau (classes Tailwind). Défaut `w-12` (48 px) ; la hauteur suit le ratio 300×330. */
  className?: string
}

/**
 * Sceau d'un badge : **métal du palier** (Fer → Diamant, assets `product/badge`) portant
 * l'emblème de son **échelle** (famille, ou exploit pour un fait ponctuel) au centre du disque.
 *
 * Le picto vit dans l'emplacement `104 × 104` prévu par les assets : l'overlay est positionné en
 * pourcentages du `viewBox` (aucune déformation, quelle que soit la taille d'affichage). Verrouillé,
 * le sceau reprend le traitement d'une récompense verrouillée (`opacity-45 grayscale`) ; acquis, il
 * reste en pleine couleur.
 */
export function BadgeMedallion({
  family,
  tier,
  code,
  locked = false,
  className,
}: BadgeMedallionProps) {
  const icon = badgeIcon(code ?? "", family)
  // Repli bronze pour un palier inconnu d'une version future : la médaille ne casse jamais.
  const asset = BADGE_ASSETS[tier] ?? BADGE_ASSETS.BRONZE
  const ink = badgePictoInkOf(tier)

  return (
    <span
      data-slot="badge-medallion"
      className={cn(
        "relative inline-block aspect-[300/330] w-12 shrink-0 align-top",
        locked && LOCKED_VISUAL_CLASS,
        className
      )}
      aria-hidden
    >
      <img src={asset} alt="" className="block h-auto w-full select-none" />
      <span
        className="pointer-events-none absolute left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${BADGE_SLOT_CENTER_Y_RATIO * 100}%`,
          width: `${BADGE_SLOT_WIDTH_RATIO * 100}%`,
        }}
      >
        {createElement(icon, {
          className: "size-full",
          weight: "bold",
          style: {
            color: ink,
            filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.65))",
          },
        })}
      </span>
    </span>
  )
}
