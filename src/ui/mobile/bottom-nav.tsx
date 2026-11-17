import type React from 'react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { useT } from '@/lib/i18n'

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
  const t = useT()
  return (
    <nav
      aria-label={t('ds.mainNav')}
      style={{ '--jo-nav-count': items.length } as React.CSSProperties}
      className={cn(
        'grid flex-none grid-cols-[repeat(var(--jo-nav-count),minmax(0,1fr))] border-t border-jo-border bg-jo-glass px-2 pb-[var(--jo-safe-bottom,0px)] backdrop-blur-xl',
        // Largeur « regular » (cadre web paysage, `jo-regular`, 2026-11-16) : rail vertical de 88 px à gauche, onglets
        // empilés en haut, filet à droite. La hauteur rendue au contenu manque le plus en paysage (626 px).
        'jo-regular:w-[88px] jo-regular:grid-cols-1 jo-regular:content-start jo-regular:gap-1 jo-regular:border-t-0 jo-regular:border-r jo-regular:px-0 jo-regular:pt-[calc(var(--jo-safe-top,0px)+12px)]',
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
            aria-label={badge ? t('ds.navNew', { label, count: badge > 9 ? t('ds.moreThan9') : badge }) : undefined}
            onClick={() => onChange?.(key)}
            className={cn(
              'jo-transition jo-focus relative grid h-[var(--jo-tab-bar-height,80px)] jo-regular:h-[68px] cursor-pointer content-center justify-items-center gap-[var(--jo-tab-bar-gap,4px)] jo-pressed:scale-[.94]',
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
