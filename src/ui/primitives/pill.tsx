import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { tint } from '../lib/tokens'

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
  icon?: Icon
  className?: string
  children: ReactNode
}

export function Pill({ tone = 'neutral', icon: IconComponent, className, children }: PillProps) {
  const color = TONE_COLOR[tone]
  const hasDot = !IconComponent && ['online', 'pending', 'suspended'].includes(tone)
  return (
    <span
      style={{ color, backgroundColor: tint(tone === 'pending' ? 'var(--jo-accent)' : color) }}
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
