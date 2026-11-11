import { CheckIcon, type Icon } from '@phosphor-icons/react'
import type { KeyboardEvent } from 'react'
import { cn } from '../lib/cn'

export type MenuItem = {
  label: string
  checked?: boolean
  icon?: Icon
  destructive?: boolean
  /** Espace au-dessus de l'élément. */
  separated?: boolean
  onClick?: () => void
}

export type MenuProps = {
  items: MenuItem[]
  title?: string
  /** Largeur en px. */
  width?: number
  className?: string
}

/** Une seule tabulation (le premier élément) ; flèches, Début et Fin déplacent le focus. */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role^=menuitem]')]
  const index = items.indexOf(document.activeElement as HTMLElement)
  const target =
    event.key === 'ArrowDown' ? (index + 1) % items.length
    : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length
    : event.key === 'Home' ? 0
    : event.key === 'End' ? items.length - 1
    : undefined
  if (target === undefined) return
  event.preventDefault()
  items[target]?.focus()
}

export function Menu({ items, title, width = 240, className }: MenuProps) {
  // Un menu de choix (tri, filtre) : tous ses éléments annoncent leur état.
  const selectable = items.some((item) => item.checked !== undefined)
  return (
    <div
      role="menu"
      aria-label={title}
      onKeyDown={moveFocus}
      style={{ width }}
      className={cn('grid max-w-full rounded-jo-lg bg-jo-raised p-1 shadow-jo ring-1 ring-jo-border ring-inset', className)}
    >
      {title && <span className="jo-type-caption px-3 pt-2 pb-1 font-semibold text-jo-muted">{title}</span>}
      {items.map(({ label, checked, icon: IconComponent, destructive, separated, onClick }, index) => (
        <button
          key={label}
          type="button"
          role={selectable ? 'menuitemradio' : 'menuitem'}
          aria-checked={selectable ? Boolean(checked) : undefined}
          tabIndex={index === 0 ? 0 : -1}
          onClick={onClick}
          className={cn(
            'jo-type-body jo-transition jo-focus grid min-h-11 cursor-pointer grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-2 rounded-jo-md px-3 text-left jo-pressed:bg-jo-hover',
            destructive ? 'text-jo-wrong' : 'text-jo-text',
            separated && 'mt-2',
          )}
        >
          <span className="text-jo-accent-ink">{checked && <CheckIcon size={16} aria-hidden />}</span>
          <span className="truncate">{label}</span>
          {IconComponent && <IconComponent size={18} aria-hidden />}
        </button>
      ))}
    </div>
  )
}
