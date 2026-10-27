import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { eloTier, ELO_INITIAL } from "../domain/elo"
import { TIER_COLORS } from "../domain/progression"
import { RankBadge } from "./RankBadge"

interface EloBadgeProps {
  rating?: number | null
  provisional?: boolean
  className?: string
}

/**
 * Identité Elo d'un joueur : `Elo 842` + pastille de rang (Fer → Diamant). En provisoire, le
 * rating exact reste affiché mais le libellé le signale ; la bordure du profil est gérée par
 * l'appelant avec le même palier.
 */
export function EloBadge({ rating, provisional = false, className }: EloBadgeProps) {
  const { t } = useTranslation()
  const value = rating ?? ELO_INITIAL
  const tier = eloTier(value)

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-1.5", className)}
      data-elo-tier={tier}
    >
      <span
        className="text-xs font-semibold"
        style={{ color: TIER_COLORS[tier].text }}
      >
        {provisional
          ? t("progression.eloProvisional")
          : t("progression.elo", { rating: value })}
      </span>
      <RankBadge rank={tier} />
    </span>
  )
}
