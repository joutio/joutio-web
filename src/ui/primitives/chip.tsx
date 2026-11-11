import type { Icon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /** `suggestion` : réponse rapide, filet sans fond. */
  variant?: 'filter' | 'suggestion'
  icon?: Icon
  count?: number
}

export function Chip({
  selected = false,
  variant = 'filter',
  icon: IconComponent,
  count,
  className,
  children,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'jo-type-callout jo-transition jo-focus relative inline-flex h-8 flex-none items-center after:absolute after:inset-x-0 after:-inset-y-1.5 gap-2 rounded-jo-full px-3 whitespace-nowrap jo-pressed:opacity-60 disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer',
        selected
          ? 'bg-jo-text font-semibold text-jo-bg'
          : variant === 'suggestion'
            ? 'font-semibold text-jo-text ring-1 ring-jo-border ring-inset'
            : 'bg-jo-raised text-jo-text',
        className,
      )}
      {...props}
    >
      {IconComponent && <IconComponent size={16} aria-hidden />}
      {children}
      {count !== undefined && <span className="font-mono opacity-70">{count}</span>}
    </button>
  )
}
