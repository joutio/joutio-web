import { RobotIcon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor } from '../lib/tokens'
import type { CategoryCode } from '../tokens.generated'

export type MatchOutcome = 'win' | 'loss' | 'draw' | 'forfeit'

const OUTCOMES: Record<MatchOutcome, { label: string; className: string }> = {
  win: { label: 'Victoire', className: 'text-jo-correct' },
  loss: { label: 'Défaite', className: 'text-jo-wrong' },
  draw: { label: 'Égalité', className: 'text-jo-muted' },
  forfeit: { label: 'Abandon', className: 'text-jo-muted' },
}

export type MatchRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  topic: string
  category: CategoryCode
  sub?: string
  outcome: MatchOutcome
  score: string
  bot?: boolean
  /** Dernière ligne de la liste : sans filet. */
  last?: boolean
}

export function MatchRow({ topic, category, sub, outcome, score, bot = false, last = false, className, type = 'button', ...props }: MatchRowProps) {
  const { label, className: outcomeClass } = OUTCOMES[outcome]
  return (
    <button
      type={type}
      className={cn(
        'jo-transition jo-focus-inset flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left jo-pressed:bg-jo-hover',
        !last && 'border-b border-jo-border',
        className,
      )}
      {...props}
    >
      <span className="relative grid size-11 flex-none place-items-center rounded-jo-md text-jo-on-accent" style={{ backgroundColor: categoryColor(category) }}>
        <CategoryIcon category={category} size={22} weight="fill" className="opacity-80" />
        {bot && (
          <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-jo-full bg-jo-raised text-jo-muted ring-2 ring-jo-surface">
            <RobotIcon size={12} aria-hidden />
            <span className="sr-only">Contre le bot</span>
          </span>
        )}
      </span>
      <span className="grid min-w-0 flex-1">
        <strong className="jo-type-headline truncate">{topic}</strong>
        {sub && <span className="jo-type-caption truncate text-jo-muted">{sub}</span>}
      </span>
      <span className="grid flex-none justify-items-end gap-0.5">
        <span className={cn('jo-type-caption font-semibold', outcomeClass)}>{label}</span>
        <span className="jo-type-callout font-mono font-semibold">{score}</span>
      </span>
    </button>
  )
}
