import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { tierColorOf, type Rank } from "../domain/progression"
import { tierKeyOf } from "./labels"

interface RankBadgeProps {
  rank: Rank
  className?: string
}

/**
 * Pastille de **rang** (Fer → Diamant) : fond teinté opaque (`soft`) et encre lisible (`text`),
 * comme les paliers de badges. Réutilisée pour les titres (Réglages, sélecteur, fiches sujet) et
 * les célébrations.
 */
export function RankBadge({ rank, className }: RankBadgeProps) {
  const { t } = useTranslation()
  const color = tierColorOf(rank)

  return (
    <span
      data-rank={rank}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-2xs font-semibold whitespace-nowrap",
        className
      )}
      style={{ background: color.soft, color: color.text }}
    >
      {t(tierKeyOf(rank))}
    </span>
  )
}
