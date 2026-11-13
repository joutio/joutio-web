import { LockSimpleIcon } from '@phosphor-icons/react'
import { RankFrame } from '../brand/rank-frame'
import { cn } from '../lib/cn'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'

const SIZES = { xs: 24, sm: 32, md: 40, list: 44, row: 48, lg: 56, xl: 72, xxl: 88, preview: 140, hero: 176 } as const

/** Sous cette taille, le cadre illisible laisse la place à un filet. */
const FRAME_MIN_SIZE = 40

export type AvatarProps = {
  name: string
  src?: string
  size?: keyof typeof SIZES
  tier?: TierCode
  /** Classement non établi : filet pointillé, image désaturée. */
  provisional?: boolean
  /** Rang pas encore atteint. */
  locked?: boolean
  presence?: 'online' | 'ingame' | 'offline'
  className?: string
}

const PRESENCE = {
  online: { label: 'En ligne', className: 'bg-jo-correct' },
  ingame: { label: 'En partie', className: 'bg-jo-accent' },
  offline: { label: 'Hors ligne', className: 'bg-jo-muted' },
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function Avatar({ name, src, size = 'md', tier, provisional = false, locked = false, presence, className }: AvatarProps) {
  const px = SIZES[size]
  const image = src ? (
    <img
      src={src}
      alt={name}
      className={cn('size-full rounded-jo-full object-cover', locked && 'brightness-[.55] grayscale')}
    />
  ) : (
    <span
      role="img"
      aria-label={name}
      style={{ fontSize: Math.max(12, px * 0.36) }}
      className={cn(
        // Avatar de base lisible sur toute surface (2026-11-13) : `raised` seul se fondait dans les lignes des feuilles.
        'grid size-full place-items-center rounded-jo-full border border-jo-border bg-[color-mix(in_oklab,var(--jo-raised)_88%,var(--jo-text))] leading-none font-semibold text-jo-muted',
        locked && 'opacity-55',
      )}
    >
      {initials(name)}
    </span>
  )

  const framed = tier && !provisional && px >= FRAME_MIN_SIZE

  return (
    <span className={cn('relative inline-block flex-none', className)} style={{ width: px, height: px }}>
      {framed ? (
        <RankFrame tier={tier} size={px}>
          {image}
        </RankFrame>
      ) : (
        <span
          className={cn('block size-full rounded-jo-full', provisional && 'outline-2 outline-offset-2 outline-dashed outline-jo-border')}
          style={tier && !provisional ? { outline: `2px solid ${tierColor(tier)}` } : undefined}
        >
          {image}
        </span>
      )}
      {locked && (
        <span role="img" aria-label="Verrouillé" className="absolute right-0 bottom-0 grid size-[30%] place-items-center rounded-jo-full bg-jo-text text-jo-bg ring-2 ring-jo-bg">
          <LockSimpleIcon weight="fill" className="size-[60%]" aria-hidden />
        </span>
      )}
      {presence && (
        <span
          role="img"
          aria-label={PRESENCE[presence].label}
          className={cn(
            'absolute right-0 bottom-0 size-2.5 rounded-jo-full ring-2 ring-jo-bg',
            PRESENCE[presence].className,
          )}
        />
      )}
    </span>
  )
}
