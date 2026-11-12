import { cn } from '../lib/cn'

export type GainTagProps = {
  points: number
  className?: string
}

/** Points gagnés sur une réponse. La pastille dérive de la couleur du texte de la carte. */
export function GainTag({ points, className }: GainTagProps) {
  return (
    <span className={cn('jo-type-caption inline-grid h-6 place-items-center rounded-jo-full bg-current/15 px-2 font-mono font-bold tabular-nums', className)}>
      <span aria-hidden>+{points}</span>
      <span className="sr-only">plus {points} points</span>
    </span>
  )
}
