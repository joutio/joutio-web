import { LightningIcon } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor } from '../lib/tokens'
import type { CategoryCode } from '../tokens.generated'
import { RoundDots, type RoundResult } from './round-dots'

export type RoundIntroProps = {
  round: number
  total: number
  topic: string
  category: CategoryCode
  results: readonly RoundResult[]
  /** Manche à points doublés. */
  bonus?: boolean
  /** Joue l'ouverture et la fermeture. Sans animation, affiche l'état tenu. */
  animated?: boolean
  /** Durée de la séquence, en ms. */
  duration?: number
  /** Fin de la séquence, y compris en mouvement réduit. */
  onComplete?: () => void
  className?: string
}

/** Annonce plein écran d'une manche. Toujours sombre. */
export function RoundIntro({ round, total, topic, category, results, bonus = false, animated = false, duration = 1900, onComplete, className }: RoundIntroProps) {
  const rise = animated && 'jo-round-rise'
  return (
    <div
      data-jo-theme="dark"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onComplete?.()
      }}
      style={{ '--jo-round-duration': `${duration}ms` } as CSSProperties}
      className={cn('grid h-full content-center gap-6 overflow-hidden bg-jo-bg text-jo-text', animated && 'jo-round-clock', className)}
    >
      <div className={cn('flex items-center justify-center gap-2', rise)}>
        <span className="grid size-6 place-items-center rounded-jo-sm text-jo-on-accent" style={{ backgroundColor: categoryColor(category) }}>
          <CategoryIcon category={category} size={14} weight="fill" />
        </span>
        <span className="jo-type-callout font-semibold text-jo-muted">{topic}</span>
      </div>
      <div className={cn('grid h-[136px] grid-cols-[auto_auto] items-center justify-center gap-4 bg-jo-accent text-jo-on-accent', animated && 'jo-round-band')}>
        <span className={cn('jo-type-numeric-giant', animated && 'jo-round-number')}>{round}</span>
        <span className={cn('grid', animated && 'jo-round-word')}>
          <span className="jo-type-title-2 font-bold">Manche</span>
          <span className="jo-type-callout font-semibold opacity-70">de {total}</span>
        </span>
      </div>
      <div className={cn('grid justify-items-center gap-3', rise)}>
        <RoundDots results={results} size={12} />
        {/* Place réservée : le bandeau ne bouge pas d'une manche normale à la manche bonus. */}
        <div className="h-8">
          {bonus && (
            <span className="jo-type-callout inline-flex h-8 items-center gap-2 rounded-jo-full bg-jo-warm px-4 font-bold text-jo-accent-ink ring-1 ring-jo-accent">
              <LightningIcon size={16} weight="fill" aria-hidden />
              Question bonus · points doublés
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
