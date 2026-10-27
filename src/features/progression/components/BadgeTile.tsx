import { useTranslation } from "react-i18next"
import { cn } from "cn"
import type { BadgeFamily, BadgeItem } from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import { badgeLabelKey, tierKeyOf } from "./labels"
import { LOCKED_SURFACE_CLASS } from "./locked-visuals"

interface BadgeTileProps {
  badge: BadgeItem
  /** Famille du badge (portée par le groupe) : emblème de repli de la médaille. */
  family: BadgeFamily
  /** Ouvre la fiche détaillée (critère d'obtention et progression) — sans lui, tuile inerte. */
  onOpen?: (badge: BadgeItem) => void
}

/**
 * Tuile de badge — **à plat** : sceau métallique du palier, bordure simple, **aucune ombre portée
 * par la tuile** (le sceau SVG garde son relief interne), **fond plein** (jamais translucide).
 * Verrouillée : la tuile est atténuée et le sceau estompé/désaturé, **comme une récompense
 * verrouillée** ; acquise : bordure + fond verts `success-600` — le vert porte seul l'état, sans
 * libellé ni icône de déblocage. **Aucune progression ici** (compteur et barre vivent dans la
 * fiche) ; le nom réserve deux lignes pour que les tuiles d'une rangée aient la même hauteur.
 */
export function BadgeTile({ badge, family, onOpen }: BadgeTileProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(tierKeyOf(badge.tier))

  const body = (
    <>
      <BadgeMedallion
        family={family}
        tier={badge.tier}
        code={badge.code}
        locked={!badge.earned}
        className="w-16 compact:w-12"
      />

      <span className="flex min-h-8 items-center justify-center compact:min-h-6">
        <span className="line-clamp-2 text-xs leading-tight font-semibold compact:text-2xs">
          {label}
        </span>
      </span>
    </>
  )

  const className = cn(
    "relative flex size-39 shrink-0 flex-col items-center justify-center gap-1 rounded-card border p-2 text-center transition-colors compact:aspect-square compact:h-auto compact:w-full compact:p-1.5",
    // Fond **plein** : vert mélangé à la surface de la carte (`--card`), jamais d'alpha.
    badge.earned
      ? "border-success-600/40 bg-[color-mix(in_oklab,var(--success-600)_12%,var(--card))]"
      : cn("border-border bg-card", LOCKED_SURFACE_CLASS),
    onOpen &&
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  )
  const ariaLabel = t("progression.badgeAria", {
    name: label,
    tier,
    progress: `${badge.progress}/${badge.target}`,
  })

  if (!onOpen) {
    return (
      <div title={label} aria-label={ariaLabel} className={className}>
        {body}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      title={label}
      aria-label={ariaLabel}
      className={cn(
        className,
        badge.earned
          ? "hover:border-success-600/70"
          : "hover:border-foreground/20"
      )}
    >
      {body}
    </button>
  )
}
