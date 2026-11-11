import { CaretRightIcon, type Icon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'
import { Avatar, type AvatarProps } from './avatar'
import { Button, type ButtonProps } from './button'
import { IconButton } from './icon-button'

const PODIUM: Record<number, TierCode> = { 1: 'OR', 2: 'ARGENT', 3: 'BRONZE' }

export type PlayerRowProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'name'> & {
  name: string
  sub?: string
  src?: string
  tier?: TierCode
  presence?: AvatarProps['presence']
  /** Place au classement. */
  rank?: number
  /** Valeur en mono à droite, par exemple un Elo. */
  trail?: string
  cta?: { label: string; variant?: ButtonProps['variant']; onClick?: () => void }
  ctaIcon?: { icon: Icon; label: string; onClick?: () => void }
  chevron?: boolean
  /** Ligne du joueur connecté. */
  highlight?: boolean
  /** Atténue un joueur hors ligne. */
  dimOffline?: boolean
  last?: boolean
}

/** L'action nomme le joueur, sauf si son libellé le fait déjà. */
const withName = (label: string, name: string) => (label.includes(name) ? label : `${label}, ${name}`)

export function PlayerRow({
  name,
  sub,
  src,
  tier,
  presence,
  rank,
  trail,
  cta,
  ctaIcon,
  chevron = false,
  highlight = false,
  dimOffline = false,
  last = false,
  className,
  type = 'button',
  ...props
}: PlayerRowProps) {
  const podium = rank === undefined ? undefined : PODIUM[rank]
  return (
    <div
      className={cn(
        'flex items-center gap-2 pr-4',
        !last && 'border-b border-jo-border',
        highlight && 'bg-jo-warm',
        dimOffline && presence === 'offline' && 'opacity-50',
        className,
      )}
    >
      {/* Les actions restent hors du bouton de la ligne, pour ne pas imbriquer deux boutons. */}
      <button
        type={type}
        className="jo-transition jo-focus-inset flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-4 text-left jo-pressed:opacity-60"
        {...props}
      >
        {rank !== undefined && (
          <strong
            className={cn('jo-type-headline w-7 flex-none text-center font-mono', !podium && 'text-jo-muted')}
            style={podium ? { color: `color-mix(in oklab, ${tierColor(podium)} 50%, var(--jo-text))` } : undefined}
          >
            {rank}
          </strong>
        )}
        <Avatar name={name} src={src} tier={tier} presence={presence} size="list" />
        <span className="grid min-w-0 flex-1">
          <strong className="jo-type-headline truncate">{name}</strong>
          {sub && <span className="jo-type-caption truncate text-jo-muted">{sub}</span>}
        </span>
        {trail && <span className="jo-type-callout flex-none font-mono font-semibold">{trail}</span>}
        {chevron && <CaretRightIcon size={20} className="flex-none text-jo-muted" aria-hidden />}
      </button>
      {cta && (
        <Button size="S" variant={cta.variant ?? 'gray'} tone={(cta.variant ?? 'gray') === 'filled' ? 'accent' : 'neutral'} onClick={cta.onClick} aria-label={withName(cta.label, name)}>
          {cta.label}
        </Button>
      )}
      {ctaIcon && !cta && <IconButton icon={ctaIcon.icon} label={withName(ctaIcon.label, name)} variant="tinted" tone="accent" onClick={ctaIcon.onClick} />}
    </div>
  )
}
