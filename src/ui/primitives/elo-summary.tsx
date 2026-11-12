import { cn } from '../lib/cn'

export type EloSummaryProps = {
  elo: number
  /** Variation de la partie. */
  delta: number
  /** Objectif suivant, par exemple `Platine à 1 000 · encore 144`. */
  next?: string
  className?: string
}

export function EloSummary({ elo, delta, next, className }: EloSummaryProps) {
  const sign = delta > 0 ? '+' : ''
  const tone = delta > 0 ? 'text-jo-correct' : delta < 0 ? 'text-jo-wrong' : 'text-jo-muted'
  return (
    <div className={cn('grid justify-items-center gap-1 text-center', className)}>
      <span className="jo-type-callout font-semibold text-jo-muted">Elo</span>
      <div className="flex items-baseline gap-3">
        <strong className="jo-type-numeric-hero">{elo}</strong>
        <strong className={cn('jo-type-numeric-medium', tone)}>{`${sign}${delta}`}</strong>
      </div>
      {next && <span className="jo-type-callout text-jo-muted">{next}</span>}
    </div>
  )
}
