import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { categoryColor, categoryInk, tint } from '../lib/tokens'
import type { CategoryCode } from '../tokens.generated'

type PillTone = 'neutral' | 'online' | 'pending' | 'suspended' | 'correct' | 'wrong'

const TONE_COLOR: Record<PillTone, string> = {
  neutral: 'var(--jo-muted)',
  online: 'var(--jo-correct)',
  pending: 'var(--jo-accent-ink)',
  suspended: 'var(--jo-wrong)',
  correct: 'var(--jo-correct)',
  wrong: 'var(--jo-wrong)',
}

export type PillProps = {
  tone?: PillTone
  /**
   * Teinte d'univers (catégorie d'un sujet), à la place de `tone`. Fond **opaque** (couleur de l'univers mêlée au
   * fond) : lisible posée sur une image, dans les deux thèmes.
   */
  category?: CategoryCode
  icon?: Icon
  className?: string
  children: ReactNode
}

export function Pill({ tone = 'neutral', category, icon: IconComponent, className, children }: PillProps) {
  const color = category ? categoryInk(category) : TONE_COLOR[tone]
  const background = category ? `color-mix(in oklab, ${categoryColor(category)} 22%, var(--jo-bg))` : tint(tone === 'pending' ? 'var(--jo-accent)' : color)
  const hasDot = !category && !IconComponent && ['online', 'pending', 'suspended'].includes(tone)
  return (
    <span
      style={{ color, backgroundColor: background }}
      className={cn(
        'jo-type-caption inline-flex h-6 items-center gap-1 rounded-jo-full px-2 font-semibold whitespace-nowrap',
        className,
      )}
    >
      {IconComponent && <IconComponent size={14} weight="fill" aria-hidden />}
      {hasDot && <span className="size-1.5 rounded-jo-full bg-current" />}
      {children}
    </span>
  )
}
