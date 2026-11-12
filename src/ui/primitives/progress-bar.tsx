import { cn } from '../lib/cn'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'

type ProgressTone = 'accent' | 'correct' | 'wrong' | TierCode

const TONE_COLOR: Record<'accent' | 'correct' | 'wrong', string> = {
  accent: 'var(--jo-accent)',
  correct: 'var(--jo-correct)',
  wrong: 'var(--jo-wrong)',
}

export type ProgressBarProps = {
  value: number
  tone?: ProgressTone
  label?: string
  /** Nom accessible quand `label` n'est pas affiché. */
  ariaLabel?: string
  showValue?: boolean
  className?: string
}

export function ProgressBar({ value, tone = 'accent', label, ariaLabel, showValue = false, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value))
  const color = tone in TONE_COLOR ? TONE_COLOR[tone as keyof typeof TONE_COLOR] : tierColor(tone as TierCode)

  return (
    <div className={cn('grid w-full gap-2', className)}>
      {(label || showValue) && (
        <div className="jo-type-caption flex justify-between gap-2">
          <span className="font-semibold">{label}</span>
          {showValue && <span className="font-mono text-jo-muted">{percent} %</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? ariaLabel}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-jo-xs bg-jo-raised"
      >
        <div className="jo-progress-fill h-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
