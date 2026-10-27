import { HorizontalRail } from "@/shared/components/horizontal-rail"
import type { BadgeFamily, BadgeItem } from "../domain/progression"
import { BadgeTile } from "./BadgeTile"

interface BadgeRailProps {
  family: BadgeFamily
  /** Paliers de la famille, du plus modeste au plus rare. */
  badges: BadgeItem[]
  onOpen: (badge: BadgeItem) => void
  /** Nom accessible du rail (une région par famille). */
  label: string
}

/**
 * Les paliers d'une famille sont des **cartes carrées à taille fixe** (156 px, `BadgeTile`) dans
 * un **rail horizontal à toutes les tailles**, comme les carrousels de l'Accueil :
 * `HorizontalRail` — Arc `ScrollArea` en desktop (barre fine en surimpression, fondus
 * d'extrémité ; la molette verticale fait défiler la page), scroller natif full-bleed en
 * compact/tablette. Le `pb-3` garde le même espace sous les tuiles dans les deux modes.
 * `EXPLOIT` n'a que quatre paliers mais garde exactement la même taille de carte que les autres.
 */
export function BadgeRail({ family, badges, onOpen, label }: BadgeRailProps) {
  return (
    <HorizontalRail label={label} viewportClassName="flex gap-2 pb-3">
      {badges.map((badge) => (
        <div
          key={badge.code}
          className="shrink-0 compact:w-[calc((100%_-_1rem)/3)] compact:max-w-[9.75rem]"
        >
          <BadgeTile family={family} badge={badge} onOpen={onOpen} />
        </div>
      ))}
    </HorizontalRail>
  )
}
