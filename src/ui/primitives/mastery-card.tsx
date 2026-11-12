import { CaretDownIcon } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { cn } from '../lib/cn'
import type { TierCode } from '../tokens.generated'
import { ProgressBar } from './progress-bar'

export type MasteryCardProps = {
  topic: string
  /** XP gagnée sur la partie. */
  gained: number
  /** Avancement dans le palier, de 0 à 100. */
  progress: number
  tier: TierCode
  /** Ligne sous la jauge, par exemple `Or · 166 XP avant Platine`. */
  next: string
  /** Détail affiché au toucher. */
  breakdown?: readonly { label: string; value: number }[]
  defaultOpen?: boolean
  className?: string
}

export function MasteryCard({ topic, gained, progress, tier, next, breakdown = [], defaultOpen = false, className }: MasteryCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const expandable = breakdown.length > 0

  return (
    <div className={cn('grid w-full gap-3 rounded-jo-lg bg-jo-surface p-4', className)}>
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        aria-controls={expandable ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="jo-focus flex w-full items-center justify-between gap-2 rounded-jo-xs text-left enabled:cursor-pointer"
      >
        <span className="jo-type-callout min-w-0 truncate font-semibold">Maîtrise · {topic}</span>
        <span className="jo-type-callout flex flex-none items-center gap-1 font-mono font-bold text-jo-accent-ink">
          +{gained} XP
          {expandable && <CaretDownIcon size={16} className={cn('jo-transition text-jo-muted', open && 'rotate-180')} aria-hidden />}
        </span>
      </button>
      <ProgressBar value={progress} tone={tier} ariaLabel={`Maîtrise · ${topic}`} />
      <span className="jo-type-caption text-jo-muted">{next}</span>
      {expandable && open && (
        <dl id={panelId} className="grid gap-1 border-t border-jo-border pt-3">
          {breakdown.map(({ label, value }) => (
            <div key={label} className="jo-type-callout flex justify-between gap-2">
              <dt className="text-jo-muted">{label}</dt>
              <dd className="font-mono font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
