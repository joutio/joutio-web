import { cn } from '../lib/cn'

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

const LABELS: Record<RoundResult, string> = {
  correct: 'réussie',
  wrong: 'ratée',
  current: 'en cours',
  upcoming: 'à venir',
  unplayed: 'non jouée',
  bonus: 'bonus à venir',
  bonusCorrect: 'bonus réussie',
  bonusWrong: 'bonus ratée',
}

export type RoundDotsProps = {
  results: readonly RoundResult[]
  /** Diamètre en px. Le ×2 n'apparaît qu'à partir de 20 px. */
  size?: number
  className?: string
}

export function RoundDots({ results, size = 24, className }: RoundDotsProps) {
  const roomy = size >= 20
  return (
    <ol aria-label="Manches" className={cn('flex items-center', roomy ? 'gap-2' : 'gap-1', className)}>
      {results.map((result, index) => (
        <li
          key={index}
          aria-label={`Manche ${index + 1}, ${LABELS[result]}`}
          style={{ width: size, height: size }}
          className={cn('jo-type-caption grid place-items-center rounded-jo-full font-bold', STYLES[result])}
        >
          {result.startsWith('bonus') && roomy && '×2'}
        </li>
      ))}
    </ol>
  )
}
