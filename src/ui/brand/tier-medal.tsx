import { LightningIcon, type Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { tokens, type TierCode } from '../tokens.generated'
import { LockBadge, LOCKED_STYLE } from './lock-badge'

export type TierMedalProps = {
  tier: TierCode
  icon?: Icon
  /** Largeur en px. */
  size?: number
  state?: 'earned' | 'locked'
  className?: string
}

/** Sous cette taille, le cadenas devient illisible. */
const LOCK_MIN_SIZE = 40

export function TierMedal({ tier, icon: IconComponent = LightningIcon, size = 56, state = 'earned', className }: TierMedalProps) {
  const locked = state === 'locked'
  return (
    <span
      role="img"
      aria-label={`Médaille ${tokens.tier[tier].label}${locked ? ', verrouillée' : ''}`}
      className={cn('relative inline-block flex-none', locked && LOCKED_STYLE, className)}
      style={{ width: size, height: size * 1.1 }}
    >
      <img src={`/brand/badge/badge-${tier.toLowerCase()}.svg`} alt="" className="size-full" />
      <IconComponent
        weight="fill"
        size={size * 0.3}
        className="absolute top-[45.45%] left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ color: tokens.tier[tier].medalInk }}
        aria-hidden
      />
      {locked && size >= LOCK_MIN_SIZE && <LockBadge size={size * 0.28} className="right-[4%] bottom-[6%]" />}
    </span>
  )
}
