import { cn } from '../lib/cn'

type StatTone = 'neutral' | 'up' | 'down' | 'accent'

const TONE_STYLES: Record<StatTone, string> = {
  neutral: 'text-jo-text',
  up: 'text-jo-correct',
  down: 'text-jo-wrong',
  accent: 'text-jo-accent-ink',
}

export type StatProps = {
  label: string
  value: string
  hint?: string
  tone?: StatTone
  /** Centré, pour une rangée de trois. */
  compact?: boolean
  className?: string
}

export function Stat({ label, value, hint, tone = 'neutral', compact = false, className }: StatProps) {
  return (
    <div className={cn('grid min-w-0 content-start gap-1 rounded-jo-md bg-jo-surface p-3', compact && 'justify-items-center px-1 text-center', className)}>
      <span className={cn('jo-type-caption text-jo-muted', compact ? 'min-h-8' : 'truncate')}>{label}</span>
      <strong className={cn('jo-type-numeric whitespace-nowrap', TONE_STYLES[tone])}>{value}</strong>
      {hint && <span className="jo-type-caption truncate text-jo-muted">{hint}</span>}
    </div>
  )
}
