import type { Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export type BottomNavItem<K extends string> = {
  key: K
  label: string
  icon: Icon
  badge?: number
}

export type BottomNavProps<K extends string> = {
  items: readonly BottomNavItem<K>[]
  active: K
  onChange?: (key: K) => void
  className?: string
}

export function BottomNav<K extends string>({ items, active, onChange, className }: BottomNavProps<K>) {
  return (
    <nav
      aria-label="Navigation principale"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      className={cn(
        'grid flex-none border-t border-jo-border bg-jo-glass px-2 pb-[var(--jo-safe-bottom,0px)] backdrop-blur-xl',
        className,
      )}
    >
      {items.map(({ key, label, icon: IconComponent, badge }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange?.(key)}
            className={cn(
              'jo-transition jo-focus relative grid h-[var(--jo-tab-bar-height,80px)] cursor-pointer content-center justify-items-center gap-[var(--jo-tab-bar-gap,4px)] jo-pressed:scale-[.94]',
              isActive ? 'text-jo-accent-ink' : 'text-jo-muted',
            )}
          >
            <IconComponent size={24} weight={isActive ? 'fill' : 'regular'} aria-hidden />
            <span className={cn('jo-type-caption', isActive && 'font-semibold')}>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="jo-type-caption absolute top-[var(--jo-tab-bar-badge-top,14px)] left-[calc(50%+4px)] h-[18px] min-w-[18px] rounded-jo-full bg-jo-accent px-1 text-center leading-[18px] font-semibold text-jo-on-accent ring-2 ring-jo-bg">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
