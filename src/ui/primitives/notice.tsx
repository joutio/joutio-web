import { CheckCircleIcon, InfoIcon, RobotIcon, SwordIcon, WifiSlashIcon, type Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Button } from './button'

export type NoticeTone = 'error' | 'success' | 'info' | 'live' | 'training'

const TONES: Record<NoticeTone, { icon: Icon; iconClass: string; root: string; filledAction?: boolean; fill?: boolean }> = {
  error: { icon: WifiSlashIcon, iconClass: 'text-jo-wrong', root: 'bg-jo-surface ring-jo-border' },
  success: { icon: CheckCircleIcon, iconClass: 'text-jo-correct', root: 'bg-jo-surface ring-jo-border', fill: true },
  info: { icon: InfoIcon, iconClass: 'text-jo-muted', root: 'bg-jo-surface ring-jo-border' },
  live: { icon: SwordIcon, iconClass: 'text-jo-accent-ink', root: 'bg-jo-warm ring-jo-border', filledAction: true, fill: true },
  training: { icon: RobotIcon, iconClass: 'text-jo-accent-ink', root: 'bg-jo-warm ring-jo-accent' },
}

export type NoticeProps = {
  tone?: NoticeTone
  title: string
  message?: string
  icon?: Icon
  /** `loading` : nouvelle tentative en cours (roue, bouton inactif). */
  action?: { label: string; onClick?: () => void; loading?: boolean }
  className?: string
}

/** Message persistant dans le flux de l'écran (carte). Au-dessus de la barre du haut, utiliser `Banner`. */
export function Notice({ tone = 'error', title, message, icon, action, className }: NoticeProps) {
  const { icon: toneIcon, iconClass, root, filledAction, fill } = TONES[tone]
  const IconComponent = icon ?? toneIcon

  return (
    <div role="status" className={cn('flex w-full items-center gap-3 rounded-jo-md py-3 pr-3 pl-3.5 ring-1 ring-inset', root, className)}>
      <IconComponent size={24} weight={fill ? 'fill' : 'regular'} className={cn('flex-none', iconClass)} aria-hidden />
      <div className="grid min-w-0 flex-1">
        <strong className={cn('jo-type-callout font-semibold', tone === 'training' ? 'text-jo-accent-ink' : 'text-jo-text')}>
          {title}
        </strong>
        {message && <span className="jo-type-caption text-jo-muted">{message}</span>}
      </div>
      {action && (
        <Button
          size="S"
          variant={filledAction ? 'filled' : 'gray'}
          tone={filledAction ? 'accent' : 'neutral'}
          loading={action.loading}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
