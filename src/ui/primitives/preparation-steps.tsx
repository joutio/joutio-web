import { CheckIcon, CircleNotchIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export type PreparationStep = { id: string; label: string }

export type PreparationStepsProps = {
  steps: readonly PreparationStep[]
  /** Étape en cours (index) ; `steps.length` = tout est fait. */
  current: number
  /** Précision sous l'étape en cours (« En attente de Sofia », « Les deux joueurs sont là »). */
  detail?: string
  /** Préparation terminée : carte verte. */
  complete?: boolean
  /** Préparation engagée : carte ambrée, le salon ne peut plus être quitté. */
  engaged?: boolean
  className?: string
}

/** Étapes de préparation d'une salle (2026-11-07, d'après le stepper de joutio-web). */
export function PreparationSteps({ steps, current, detail, complete = false, engaged = false, className }: PreparationStepsProps) {
  return (
    <div
      role="progressbar"
      aria-label="Préparation du duel"
      aria-valuemin={0}
      aria-valuemax={steps.length}
      aria-valuenow={Math.min(current, steps.length)}
      className={cn(
        'grid gap-3 rounded-jo-lg border p-4',
        complete
          ? 'border-[color-mix(in_oklab,var(--jo-correct)_40%,transparent)] bg-[color-mix(in_oklab,var(--jo-correct)_12%,transparent)]'
          : engaged
            ? 'border-[color-mix(in_oklab,var(--jo-accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--jo-accent)_12%,transparent)]'
            : 'border-jo-border bg-jo-surface',
        className,
      )}
    >
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <div key={step.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <span
              className={cn(
                'grid size-6 place-items-center rounded-jo-full',
                done ? 'bg-jo-correct text-jo-bg' : cn('border-2', active ? 'border-jo-accent-ink text-jo-accent-ink' : 'border-jo-border'),
              )}
              aria-hidden
            >
              {done ? <CheckIcon size={14} weight="bold" /> : active ? <CircleNotchIcon size={14} className="jo-spin" /> : null}
            </span>
            <span className="grid min-w-0">
              <span className={cn('jo-type-callout', active && 'font-semibold', !done && !active && 'text-jo-muted')}>{step.label}</span>
              {active && detail && <span className="jo-type-caption text-jo-muted">{detail}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
