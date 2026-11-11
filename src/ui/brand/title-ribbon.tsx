import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { tokens, type TierCode } from '../tokens.generated'
import { LockBadge, LOCKED_STYLE } from './lock-badge'

export type TitleRibbonProps = {
  tier: TierCode
  text: string
  /** Largeur imposée, ou largeur intrinsèque sans troncature. */
  width?: number | 'auto'
  state?: 'earned' | 'locked'
  className?: string
}

const SCALE = 56 / 240
const LEFT = 340 * SCALE
const RIGHT = 300 * SCALE
const TILE = 100 * SCALE
const PADDING = 52

export function TitleRibbon({ tier, text, width = 220, state = 'earned', className }: TitleRibbonProps) {
  const locked = state === 'locked'
  const auto = width === 'auto'
  const label = useRef<HTMLSpanElement>(null)
  const [textWidth, setTextWidth] = useState(0)
  useLayoutEffect(() => {
    if (!auto || !label.current) return
    const observer = new ResizeObserver(([entry]) => setTextWidth(entry?.contentRect.width ?? 0))
    observer.observe(label.current)
    return () => observer.disconnect()
  }, [auto, text])
  const naturalWidth = LEFT + RIGHT + Math.max(3, Math.ceil((textWidth + PADDING * 2 - LEFT - RIGHT) / TILE)) * TILE
  const extended = auto || width > 220
  const height = extended ? 56 : width * (56 / 220)
  const path = `/brand/ruban/parts/ruban-${tier.toLowerCase()}`
  return (
    <span
      role="img"
      aria-label={[`Titre ${tokens.tier[tier].label}`, text, locked && 'verrouillé'].filter(Boolean).join(', ')}
      className={cn('relative inline-flex flex-none justify-center', locked && LOCKED_STYLE, className)}
      style={{ width: auto ? naturalWidth : width, height }}
    >
      {extended ? (
        <span className="absolute inset-0 flex" aria-hidden>
          <img src={`${path}-left.svg`} alt="" className="h-full shrink-0" style={{ width: LEFT }} />
          <span className="h-full min-w-0 flex-1" style={{ backgroundImage: `url(${path}-center.svg)`, backgroundSize: `${TILE}px ${height}px`, backgroundRepeat: 'repeat-x' }} />
          <img src={`${path}-right.svg`} alt="" className="h-full shrink-0" style={{ width: RIGHT }} />
        </span>
      ) : <img src={`/brand/ruban/ruban-${tier.toLowerCase()}.svg`} alt="" className="absolute inset-0 size-full" />}
      <span
        ref={label}
        className={cn('relative h-fit whitespace-nowrap text-center font-bold', !auto && 'truncate')}
        style={{ marginTop: height * (100 / 240) - 7, fontSize: 12, lineHeight: '14px', color: tokens.tier[tier].ribbonInk, ...(auto ? { width: 'max-content', flexShrink: 0 } : { position: 'absolute', left: extended ? PADDING : '16%', right: extended ? PADDING : '16%' }) }}
      >
        {text}
      </span>
      {locked && <LockBadge size={height * 0.4} className="right-[26px] bottom-0" />}
    </span>
  )
}
