import { ArrowClockwiseIcon, CheckCircleIcon, InfoIcon, RobotIcon, SwordIcon, WifiSlashIcon, type Icon } from '@phosphor-icons/react'
import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Button } from './button'

export type BannerTone = 'error' | 'success' | 'info' | 'live' | 'training'

/** États de la bannière de connexion globale (`etats-systeme.md`) : réseau et temps réel. */
export type BannerConnection = 'offline' | 'reconnecting' | 'retrying' | 'failed' | 'restored'

/** Teinte posée sur `bg` : la bande reste opaque sous la barre d'état. */
const TONES: Record<BannerTone, { icon: Icon; iconClass: string; tint: string; filledAction?: boolean; fill?: boolean }> = {
  error: { icon: WifiSlashIcon, iconClass: 'text-jo-wrong', tint: 'bg-jo-wrong/12' },
  success: { icon: CheckCircleIcon, iconClass: 'text-jo-correct', tint: 'bg-jo-correct/12', fill: true },
  info: { icon: InfoIcon, iconClass: 'text-jo-muted', tint: 'bg-jo-raised' },
  live: { icon: SwordIcon, iconClass: 'text-jo-accent-ink', tint: 'bg-jo-warm', filledAction: true, fill: true },
  training: { icon: RobotIcon, iconClass: 'text-jo-accent-ink', tint: 'bg-jo-warm' },
}

const CONNECTION: Record<BannerConnection, { title: string; message: string; icon: Icon }> = {
  offline: { title: 'Pas de connexion', message: 'Tout se met à jour dès ton retour en ligne.', icon: WifiSlashIcon },
  reconnecting: { title: 'Reconnexion…', message: 'Le temps réel reprend dans un instant.', icon: ArrowClockwiseIcon },
  retrying: { title: 'Nouvelle tentative…', message: 'On vérifie ta connexion.', icon: WifiSlashIcon },
  failed: { title: 'Toujours hors connexion', message: 'Vérifie ton réseau, puis réessaie.', icon: WifiSlashIcon },
  restored: { title: 'Connexion rétablie', message: 'Tout est à jour.', icon: CheckCircleIcon },
}

type BannerAction = { label: string; onClick?: () => void; loading?: boolean }

export type BannerProps =
  | {
      /** Bannière de connexion : textes, icône, ton et Réessayer viennent de l'état. */
      connection: BannerConnection
      onRetry?: () => void
      className?: string
      tone?: never
      title?: never
      message?: never
      icon?: never
      action?: never
    }
  | {
      connection?: never
      onRetry?: never
      tone?: BannerTone
      title: string
      message?: string
      icon?: Icon
      /** `loading` : nouvelle tentative en cours (roue, bouton inactif). */
      action?: BannerAction
      className?: string
    }

/**
 * Bande pleine largeur, tout en haut de la fenêtre, au-dessus de la barre du haut qu'elle pousse vers le bas.
 * Pas une carte : ni rayon ni marge, un filet en bas. Sur mobile, elle remonte sous la barre d'état (hors safe
 * area) : elle porte elle-même `--jo-safe-top`. Avec `connection`, c'est la bannière de connexion globale.
 * Dans le flux de l'écran, utiliser `Notice`.
 */
export function Banner(props: BannerProps) {
  let tone: BannerTone
  let title: string
  let message: string | undefined
  let icon: Icon | undefined
  let action: BannerAction | undefined
  if (props.connection) {
    const restored = props.connection === 'restored'
    ;({ title, message, icon } = CONNECTION[props.connection])
    tone = restored ? 'success' : 'error'
    action = restored ? undefined : { label: 'Réessayer', onClick: props.onRetry, loading: props.connection === 'retrying' }
  } else {
    ;({ title, message, icon, action } = props)
    tone = props.tone ?? 'error'
  }
  const { icon: toneIcon, iconClass, tint, filledAction, fill } = TONES[tone]
  const IconComponent = icon ?? toneIcon

  return (
    <div role="status" className={cn('relative w-full flex-none border-b bg-jo-bg', tone === 'training' ? 'border-jo-accent' : 'border-jo-border', props.className)}>
      <div aria-hidden className={cn('absolute inset-0', tint)} />
      <div className="relative flex min-h-14 items-center gap-3 pt-[calc(var(--jo-safe-top,0px)+8px)] pr-3 pb-2 pl-4">
        <IconComponent size={22} weight={fill ? 'fill' : 'regular'} className={cn('flex-none', iconClass)} aria-hidden />
        <div className="grid min-w-0 flex-1">
          <strong className={cn('jo-type-callout truncate font-semibold', tone === 'training' ? 'text-jo-accent-ink' : 'text-jo-text')}>
            {title}
          </strong>
          {message && <span className="jo-type-caption truncate text-jo-muted">{message}</span>}
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
    </div>
  )
}

/**
 * Bande globale posée par le layout de l'app connectée (bannière de connexion) : `Screen` et `ParallaxScreen` la
 * lisent et la placent tout en haut. Elle l'emporte sur la `banner` propre à l'écran. Les écrans immersifs (duel,
 * matchmaking) ne la lisent pas : `ReconnectCountdown` s'en charge.
 */
export const GlobalBannerContext = createContext<ReactNode>(null)

export const useGlobalBanner = () => useContext(GlobalBannerContext)
