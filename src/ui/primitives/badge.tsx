import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'

type BadgeVariant = 'neutral' | 'accent' | 'correct' | 'wrong' | 'outline' | 'tier'

export type BadgeProps = {
  variant?: BadgeVariant
  /** Requis avec la variante `tier`. */
  tier?: TierCode
  className?: string
  children: ReactNode
}

const STYLES: Record<Exclude<BadgeVariant, 'tier'>, string> = {
  neutral: 'bg-jo-raised text-jo-muted',
  accent: 'bg-jo-accent text-jo-on-accent',
  correct: 'bg-jo-correct/16 text-jo-correct',
  wrong: 'bg-jo-wrong/16 text-jo-wrong',
  outline: 'text-jo-muted ring-1 ring-jo-border ring-inset',
}

export function Badge({ variant = 'neutral', tier = 'OR', className, children }: BadgeProps) {
  const isTier = variant === 'tier'
  const style: CSSProperties | undefined = isTier ? { backgroundColor: tierColor(tier) } : undefined

  return (
    <span
      // Le Fer est sombre : son texte prend le blanc du thème dark.
      data-jo-theme={isTier && tier === 'FER' ? 'dark' : undefined}
      style={style}
      className={cn(
        'jo-type-caption inline-flex h-6 items-center gap-1 rounded-jo-xs px-2 font-semibold whitespace-nowrap',
        isTier ? (tier === 'FER' ? 'text-jo-text' : 'text-jo-on-accent') : STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
