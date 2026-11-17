import { cn } from '../lib/cn'
import { useT, type MessageKey } from '@/lib/i18n'

export type ReviewAnswer = 'correct' | 'wrong' | 'none'

const DOTS: Record<ReviewAnswer, { className: string; label: MessageKey }> = {
  correct: { className: 'bg-jo-correct', label: 'ds.correctLower' },
  wrong: { className: 'bg-jo-wrong', label: 'ds.wrongLower' },
  none: { className: 'bg-jo-raised', label: 'ds.noAnswer' },
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
  /** Écran court (iPhone Duo plié, 2026-11-14) : sans les points de la manche, gardés pour les lecteurs d'écran. */
  compact?: boolean
  className?: string
}

/** Sélecteur de manche de la revue : ton résultat à gauche, celui de l'adversaire à droite. */
export function RoundReviewTabs({ rounds, value, onChange, compact = false, className }: RoundReviewTabsProps) {
  const t = useT()
  return (
    <div role="group" aria-label={t('ds.rounds')} className={cn('grid gap-1', className)} style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
      {rounds.map((round, index) => (
        <button
          key={index}
          type="button"
          aria-current={index === value ? 'true' : undefined}
          aria-label={t('ds.reviewA11y', { n: index + 1, me: t(DOTS[round.me].label), opponent: t(DOTS[round.opponent].label), points: round.points })}
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
          {!compact && <span className="jo-type-caption font-mono font-semibold">{round.points}</span>}
        </button>
      ))}
    </div>
  )
}
