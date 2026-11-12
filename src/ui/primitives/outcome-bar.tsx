import { cn } from '../lib/cn'

export type OutcomeBarProps = {
  wins: number
  draws: number
  losses: number
  className?: string
}

const OUTCOMES = [
  { key: 'wins', label: 'Victoires', color: 'var(--jo-correct)', ink: 'text-jo-correct' },
  { key: 'draws', label: 'Nuls', color: 'var(--jo-accent)', ink: 'text-jo-accent-ink' },
  { key: 'losses', label: 'Défaites', color: 'var(--jo-wrong)', ink: 'text-jo-wrong' },
] as const

/** En % de la largeur : marge d'un libellé au bord, et écart entre deux centres de libellés. */
const LABEL_EDGE = 10
const LABEL_GAP = 21

/** Centre chaque libellé sous sa part, puis l'écarte juste assez pour éviter le chevauchement. */
function labelPositions(shares: readonly number[]) {
  let start = 0
  const positions = shares.map((share) => {
    const center = start + share / 2
    start += share
    return Math.max(center, LABEL_EDGE)
  })
  for (let index = 1; index < positions.length; index += 1) positions[index] = Math.max(positions[index] ?? 0, (positions[index - 1] ?? 0) + LABEL_GAP)
  positions[positions.length - 1] = Math.min(positions[positions.length - 1] ?? 0, 100 - LABEL_EDGE)
  for (let index = positions.length - 2; index >= 0; index -= 1) positions[index] = Math.min(positions[index] ?? 0, (positions[index + 1] ?? 0) - LABEL_GAP)
  return positions
}

/** Répartition des issues : libellés et pourcentages, jamais la couleur seule. */
export function OutcomeBar({ wins, draws, losses, className }: OutcomeBarProps) {
  const values = { wins, draws, losses }
  const total = wins + draws + losses
  const percent = (value: number) => (total > 0 ? Math.round((value * 100) / total) : 0)
  const shown = OUTCOMES.filter(({ key }) => percent(values[key]) > 0)
  const positions = labelPositions(shown.map(({ key }) => (values[key] * 100) / total))
  const summary = shown.map(({ key, label }) => `${label} ${percent(values[key])} %`).join(', ') || 'Aucune partie'

  return (
    <div role="img" aria-label={summary} className={cn('grid w-full gap-2', className)}>
      <div className="flex h-2 gap-1 overflow-hidden rounded-jo-xs bg-jo-raised">
        {shown.map(({ key, color }) => (
          <span key={key} style={{ flexGrow: values[key], backgroundColor: color }} />
        ))}
      </div>
      {shown.length > 0 && (
        <div className="grid overflow-hidden">
          {shown.map(({ key, label, ink }, index) => (
            <span key={key} className="relative col-start-1 row-start-1 grid w-max -translate-x-1/2 justify-items-center" style={{ left: `${positions[index]}%` }}>
              <span className="jo-type-caption text-jo-muted">{label}</span>
              <strong className={cn('jo-type-headline font-mono', ink)}>{percent(values[key])} %</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
