import { useTranslation } from "react-i18next"
import { CheckIcon } from "@phosphor-icons/react"
import {
  badgeProgressPercent,
  tierColorOf,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import {
  METRIC_ACTION_KEYS,
  METRIC_REMAINING_KEYS,
  ONE_SHOT_CONDITION_KEYS,
  tierKeyOf,
} from "./labels"
interface BadgeDetailProps {
  badge: BadgeItem
  family: BadgeFamily
}

/**
 * Fiche détaillée d'un badge (corps de la modal) : médaille, **rareté** (libellé du palier teinté
 * avec sa couleur), **objectif** et, tant qu'il est verrouillé, **ce qu'il reste à faire** (deux
 * lignes distinctes) puis la progression chiffrée (barre au aplat du palier). Le critère n'est
 * jamais réduit à l'intitulé du compteur. Verrouillée, la médaille est atténuée et désaturée comme
 * l'aperçu d'une récompense verrouillée ; la rareté reste lisible en couleur.
 */
export function BadgeDetail({ badge, family }: BadgeDetailProps) {
  const { t } = useTranslation()
  const percent = badgeProgressPercent(badge)
  const color = tierColorOf(badge.tier)
  const remaining = Math.max(0, badge.target - badge.progress)
  const oneShotKey = ONE_SHOT_CONDITION_KEYS[badge.code]
  const objective = oneShotKey
    ? t(oneShotKey)
    : t(METRIC_ACTION_KEYS[badge.metric], { count: badge.target })
  const remainingObjective =
    !badge.earned && badge.metric !== "ONE_SHOT" && remaining > 0
      ? t(METRIC_REMAINING_KEYS[badge.metric], { count: remaining })
      : null

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BadgeMedallion
        family={family}
        tier={badge.tier}
        code={badge.code}
        locked={!badge.earned}
        className="w-32"
      />

      <p className="text-xs font-semibold" style={{ color: color.text }}>
        {t("progression.rarity", { tier: t(tierKeyOf(badge.tier)) })}
      </p>

      <div className="flex flex-col gap-1 text-sm leading-relaxed">
        <p className="flex items-start justify-center gap-1.5">
          {badge.earned && (
            <CheckIcon
              data-glyph="check"
              className="mt-0.5 size-4 shrink-0 text-success-600"
            />
          )}
          <span>{objective}</span>
        </p>
        {remainingObjective && (
          <p className="font-semibold text-foreground">{remainingObjective}</p>
        )}
      </div>

      {!badge.earned && (
        <div className="flex w-full flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3 text-xs font-semibold">
            <span>
              {t("progression.badgeProgress", {
                progress: badge.progress,
                target: badge.target,
              })}
            </span>
            <span className="text-muted-foreground font-mono tabular-nums">
              {percent} %
            </span>
          </span>
          <span className="block h-4 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full"
              style={{ width: `${percent}%`, background: color.fill }}
            />
          </span>
        </div>
      )}
    </div>
  )
}
