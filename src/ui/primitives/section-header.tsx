import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Niveau du titre dans la hiérarchie de l'écran. */
  level?: 2 | 3 | 4
  className?: string
}

export function SectionHeader({ title, subtitle, action, level = 2, className }: SectionHeaderProps) {
  const Heading = `h${level}` as const
  return (
    <div className={cn('flex w-full items-center justify-between gap-3', className)}>
      <div className="grid min-w-0">
        <Heading className="jo-type-title-2 truncate">{title}</Heading>
        {subtitle && <p className="jo-type-callout text-jo-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  )
}
