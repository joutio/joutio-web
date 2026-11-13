import { FireIcon } from '@phosphor-icons/react'
import { UnlockContent } from './unlock-content'

/** Paliers de série annoncés dans la carte « Prochain » (le 7e débloque Micah, `avatar.md`). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const

/** Prochain palier strictement au-dessus de `days`, ou `undefined` au-delà du dernier. */
export const nextStreakMilestone = (days: number) => STREAK_MILESTONES.find((milestone) => milestone > days)

const daysLabel = (days: number) => (days > 1 ? `${days} jours` : `${days} jour`)

export type StreakUnlockProps = {
  /** Jours de série atteints avec cette partie. */
  days: number
  /** Suite de « Prochain : 7 jours », par exemple `débloque Micah.` Par défaut : les jours restants. */
  nextRule?: string
}

/**
 * Nouveau jour de série (2026-11-13) : la première partie classée du jour ouvre la séquence de déblocages, avant le
 * rang, les titres et les badges. La flamme s'allume (`jo-ignite`) ; couleur d'accent, aucun rang en jeu.
 */
export function StreakUnlock({ days, nextRule }: StreakUnlockProps) {
  const next = nextStreakMilestone(days)
  return (
    <UnlockContent
      accent={{ glow: 'var(--jo-accent)', ink: 'var(--jo-accent-ink)', label: daysLabel(days) }}
      crumbLead={<FireIcon size={16} weight="fill" aria-hidden />}
      crumbFrom="Série"
      hero={
        <span className="relative grid size-[160px] place-items-center rounded-jo-full bg-jo-warm text-jo-accent">
          <FireIcon size={104} weight="fill" aria-hidden />
          <strong className="jo-type-title-1 absolute -bottom-2 rounded-jo-full bg-jo-accent px-3 py-1 text-jo-on-accent">{days}</strong>
        </span>
      }
      heroMotion="jo-ignite"
      eyebrow="Nouveau jour de série"
      headline={daysLabel(days)}
      text={days > 1 ? `Tu as joué ${days} jours d'affilée. Reviens demain pour passer à ${daysLabel(days + 1)}.` : 'Ta série commence. Reviens demain pour la prolonger.'}
      next={
        next
          ? {
              label: daysLabel(next),
              rule: nextRule ?? `encore ${daysLabel(next - days)}.`,
              preview: (
                <span className="grid size-12 place-items-center rounded-jo-full bg-jo-raised text-jo-muted">
                  <FireIcon size={28} weight="fill" aria-hidden />
                </span>
              ),
            }
          : undefined
      }
    />
  )
}
