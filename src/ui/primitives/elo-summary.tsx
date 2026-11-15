import { cn } from '../lib/cn'

export type EloSummaryProps = {
  elo: number
  /** Variation de la partie. */
  delta: number
  /** Objectif suivant, par exemple `Platine à 1 000 · encore 144`. */
  next?: string
  /**
   * Écran court : Elo en `numeric-large` au lieu de `numeric-hero`, à côté de la maîtrise. Le delta passe sous l'Elo
   * (2026-11-15) : côte à côte, un Elo à 4 chiffres et la maîtrise ne tenaient pas sur un téléphone de 360 px, et la
   * page du résultat ne défile jamais (le geste vertical ouvre les détails).
   */
  compact?: boolean
  className?: string
}

export function EloSummary({ elo, delta, next, compact = false, className }: EloSummaryProps) {
  const sign = delta > 0 ? '+' : ''
  const tone = delta > 0 ? 'text-jo-correct' : delta < 0 ? 'text-jo-wrong' : 'text-jo-muted'
  return (
    <div className={cn('grid justify-items-center gap-1 text-center', className)}>
      <span className="jo-type-callout font-semibold text-jo-muted">Elo</span>
      <div className={compact ? 'grid justify-items-center' : 'flex items-baseline gap-3'}>
        <strong className={compact ? 'jo-type-numeric-large' : 'jo-type-numeric-hero'}>{elo}</strong>
        <strong className={cn('jo-type-numeric-medium', tone)}>{`${sign}${delta}`}</strong>
      </div>
      {next && <span className="jo-type-callout text-jo-muted">{next}</span>}
    </div>
  )
}
