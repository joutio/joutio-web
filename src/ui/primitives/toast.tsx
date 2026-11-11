import {
  BellIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Avatar, type AvatarProps } from './avatar'

export type ToastTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

const TONES: Record<ToastTone, { icon: Icon; className: string; regular?: boolean }> = {
  success: { icon: CheckCircleIcon, className: 'text-jo-correct' },
  danger: { icon: XCircleIcon, className: 'text-jo-wrong' },
  warning: { icon: WarningIcon, className: 'text-jo-accent-ink' },
  info: { icon: InfoIcon, className: 'text-jo-accent-ink' },
  neutral: { icon: BellIcon, className: 'text-jo-muted', regular: true },
}

export type ToastProps = {
  tone?: ToastTone
  title: string
  description?: string
  icon?: Icon
  /** Joueur à l'origine du message : remplace l'icône. */
  actor?: Pick<AvatarProps, 'name' | 'src' | 'tier'>
  /** Opération en cours : spinner à la place de l’icône. */
  loading?: boolean
  /** Rend tout le toast cliquable. Aucun bouton d’action séparé. */
  onClick?: () => void
  className?: string
}

export function Toast({ tone = 'neutral', title, description, icon, actor, loading = false, onClick, className }: ToastProps) {
  const { icon: toneIcon, className: toneClass, regular } = TONES[tone]
  const IconComponent = icon ?? toneIcon
  const Root = onClick ? 'button' : 'div'

  return (
    <Root
      role={onClick ? undefined : 'status'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'jo-focus flex min-h-16 w-full max-w-[358px] items-center gap-3 rounded-jo-md bg-jo-surface px-3.5 py-3 text-left shadow-jo',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {loading ? <CircleNotchIcon size={32} className="flex-none animate-spin motion-reduce:animate-none text-jo-muted" aria-hidden /> : actor ? (
        <Avatar {...actor} size="sm" />
      ) : (
        <IconComponent size={32} weight={regular ? 'regular' : 'fill'} className={cn('flex-none', toneClass)} aria-hidden />
      )}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className={cn("jo-type-callout font-semibold wrap-anywhere text-jo-text", description ? "truncate" : "line-clamp-2")}>{title}</strong>
        {description && <span className="jo-type-caption truncate text-jo-muted">{description}</span>}
      </span>
      {onClick && <CaretRightIcon size={16} className="flex-none self-center text-jo-muted" aria-hidden />}
    </Root>
  )
}
