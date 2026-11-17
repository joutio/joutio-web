import { cn } from '../lib/cn'
import { useT, type MessageKey } from '@/lib/i18n'

export const ROUND_RESULTS = ['correct', 'wrong', 'current', 'upcoming', 'unplayed', 'bonus', 'bonusCorrect', 'bonusWrong'] as const
export type RoundResult = (typeof ROUND_RESULTS)[number]

const STYLES: Record<RoundResult, string> = {
  correct: 'bg-jo-correct',
  wrong: 'bg-jo-wrong',
  current: 'ring-2 ring-jo-text ring-inset',
  upcoming: 'bg-jo-raised',
  unplayed: 'ring-1 ring-jo-border ring-inset',
  bonus: 'text-jo-accent-ink ring-2 ring-jo-accent ring-inset',
  bonusCorrect: 'bg-jo-correct text-jo-on-correct',
  bonusWrong: 'bg-jo-wrong text-jo-on-wrong',
}

const LABELS: Record<RoundResult, MessageKey> = {
  correct: 'ds.round.correct',
  wrong: 'ds.round.wrong',
  current: 'ds.round.current',
  upcoming: 'ds.upcoming',
  unplayed: 'ds.round.unplayed',
  bonus: 'ds.round.bonus',
  bonusCorrect: 'ds.round.bonusCorrect',
  bonusWrong: 'ds.round.bonusWrong',
}

export type RoundDotsProps = {
  results: readonly RoundResult[]
  /** Diamètre en px. Le ×2 n'apparaît qu'à partir de 20 px. */
  size?: number
  className?: string
}

export function RoundDots({ results, size = 24, className }: RoundDotsProps) {
  const t = useT()
  const roomy = size >= 20
  return (
    <ol aria-label={t('ds.rounds')} className={cn('flex items-center', roomy ? 'gap-2' : 'gap-1', className)}>
      {results.map((result, index) => (
        <li
          key={index}
          aria-label={t('ds.roundA11y', { n: index + 1, state: t(LABELS[result]) })}
          style={{ width: size, height: size }}
          className={cn('jo-type-caption grid place-items-center rounded-jo-full font-bold', STYLES[result])}
        >
          {result.startsWith('bonus') && roomy && '×2'}
        </li>
      ))}
    </ol>
  )
}
