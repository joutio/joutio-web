import { CaretRightIcon, TrashIcon, type Icon } from '@phosphor-icons/react'
import { useRef, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import { cn } from '../lib/cn'
import { Avatar, type AvatarProps } from './avatar'

export type NotificationRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string
  sub?: string
  /** Notification système. Ignorée si `player` est fourni. */
  icon?: Icon
  /** Joueur à l'origine de la notification. */
  player?: Pick<AvatarProps, 'name' | 'src' | 'tier' | 'presence'>
  unread?: boolean
  /**
   * Révélée en balayant vers la gauche. Le bouton reste atteignable au clavier.
   */
  onDelete?: () => void
  last?: boolean
}

/**
 * Ligne de la boîte de réception : toucher ouvre l'écran qui propose l'action (défis, salon, fiche joueur), balayer
 * révèle Supprimer. **Aucun bouton d'action dans la ligne** (2026-11-07) : la notification ne fait que rediriger.
 */
export function NotificationRow({ title, sub, icon: IconComponent, player, unread = false, onDelete, last = false, className, type = 'button', ...props }: NotificationRowProps) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  // Le tactile défile seul : la souris, elle, ne balaie pas sans aide.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    const distance = state.x - event.clientX
    if (Math.abs(distance) < 4) return
    state.moved = true
    event.currentTarget.style.scrollSnapType = 'none'
    event.currentTarget.scrollLeft = state.left + distance
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const element = event.currentTarget
    const moved = drag.current.moved
    element.style.scrollSnapType = ''
    if (moved) element.dataset.dragged = 'true'
    drag.current = null
  }

  const content = (
    <button type={type} className="jo-transition jo-focus-inset flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-4 text-left jo-pressed:opacity-60" {...props}>
      {player ? (
        <Avatar {...player} size="list" />
      ) : (
        <span className="grid size-11 flex-none place-items-center rounded-jo-full bg-jo-raised text-jo-muted">{IconComponent && <IconComponent size={22} aria-hidden />}</span>
      )}
      <span className="grid min-w-0 flex-1">
        <span className={cn('jo-type-headline truncate', !unread && 'font-normal')}>{title}</span>
        {sub && <span className="jo-type-caption truncate text-jo-muted">{sub}</span>}
      </span>
      {unread && (
        <span role="img" aria-label="Non lue" className="size-2 flex-none rounded-jo-full bg-jo-accent" />
      )}
      <CaretRightIcon size={16} className="flex-none text-jo-muted" aria-hidden />
    </button>
  )

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onClickCapture={(event) => {
        // Un balayage à la souris se termine par un clic : il n'ouvre pas la ligne.
        if (event.currentTarget.dataset.dragged !== 'true') return
        delete event.currentTarget.dataset.dragged
        event.stopPropagation()
      }}
      className={cn('jo-no-scrollbar flex snap-x snap-mandatory overflow-x-auto', !last && 'border-b border-jo-border', className)}
    >
      <div className="flex w-full flex-none snap-start items-center gap-2 pr-4">
        {content}
      </div>
      {onDelete && (
        <button type="button" aria-label={`Supprimer : ${title}`} onClick={onDelete} className="jo-transition jo-focus-inset grid w-20 flex-none cursor-pointer snap-end place-items-center bg-jo-wrong text-jo-on-wrong jo-pressed:brightness-90">
          <TrashIcon size={22} aria-hidden />
        </button>
      )}
    </div>
  )
}
