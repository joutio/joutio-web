import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type EmptyStateProps = {
  icon: Icon
  title: string
  description?: string
  action?: ReactNode
  /** Niveau du titre dans la hiérarchie de l'écran. */
  level?: 2 | 3 | 4
  className?: string
}

/** Centré dans la hauteur de son parent, quand ce parent en a une. */
export function EmptyState({ icon: IconComponent, title, description, action, level = 3, className }: EmptyStateProps) {
  const Heading = `h${level}` as const
  return (
    <div className={cn('grid min-h-full w-full content-center justify-items-center gap-3 px-4 py-8 text-center', className)}>
      <span className="grid size-14 -rotate-6 place-items-center rounded-jo-lg bg-jo-accent text-jo-on-accent">
        <IconComponent size={28} weight="fill" aria-hidden />
      </span>
      <Heading className="jo-type-title-2 text-balance">{title}</Heading>
      {description && <p className="jo-type-body max-w-[300px] text-pretty text-jo-muted">{description}</p>}
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  )
}
