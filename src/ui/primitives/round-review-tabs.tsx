import { cn } from '../lib/cn'

export type ReviewAnswer = 'correct' | 'wrong' | 'none'

const DOTS: Record<ReviewAnswer, { className: string; label: string }> = {
  correct: { className: 'bg-jo-correct', label: 'bonne réponse' },
  wrong: { className: 'bg-jo-wrong', label: 'mauvaise réponse' },
  none: { className: 'bg-jo-raised', label: 'sans réponse' },
}

export type ReviewRoundTab = {
  me: ReviewAnswer
  opponent: ReviewAnswer
  /** Points gagnés sur la manche. */
  points: number
}

export type RoundReviewTabsProps = {
  rounds: readonly ReviewRoundTab[]
  /** Index de la manche affichée. */
  value: number
  onChange?: (index: number) => void
  className?: string
}

/** Sélecteur de manche de la revue : ton résultat à gauche, celui de l'adversaire à droite. */
export function RoundReviewTabs({ rounds, value, onChange, className }: RoundReviewTabsProps) {
  return (
    <div role="group" aria-label="Manches" className={cn('grid gap-1', className)} style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
      {rounds.map((round, index) => (
        <button
          key={index}
          type="button"
          aria-current={index === value ? 'true' : undefined}
          aria-label={`Question ${index + 1} : ta réponse, ${DOTS[round.me].label} ; adversaire, ${DOTS[round.opponent].label} ; ${round.points} points`}
          onClick={() => onChange?.(index)}
          className={cn(
            'jo-transition jo-focus grid cursor-pointer justify-items-center gap-1 rounded-jo-md px-0.5 py-2 ring-inset',
            index === value ? 'bg-jo-warm ring-2 ring-jo-accent' : 'ring-1 ring-jo-border',
          )}
        >
          <span className="jo-type-caption font-semibold text-jo-muted">Q{index + 1}</span>
          <span className="flex gap-1">
            <span className={cn('size-2 rounded-[2px]', DOTS[round.me].className)} />
            <span className={cn('size-2 rounded-[2px]', DOTS[round.opponent].className)} />
          </span>
          <span className="jo-type-caption font-mono font-semibold">{round.points}</span>
        </button>
      ))}
    </div>
  )
}
