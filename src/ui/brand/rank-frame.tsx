import type { CSSProperties, ReactNode } from 'react'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'

type FrameLayers = {
  /** Marge du contenu dans son cadre, en fraction de la taille. */
  inset: number
  spin?: number
  counter?: number
  pulse?: boolean
}

// Valeurs identiques à joutio-mobile/src/ui/jo/rank-frames.ts.
const FRAMES: Record<TierCode, FrameLayers> = {
  FER: { inset: 0.05 },
  BRONZE: { inset: 0.075 },
  ARGENT: { inset: 0.08 },
  OR: { inset: 0.085 },
  PLATINE: { inset: 0.09, spin: 5000 },
  EMERAUDE: { inset: 0.095, spin: 4500 },
  DIAMANT: { inset: 0.1, spin: 7000, counter: 3500, pulse: true },
}

/** Le viewBox des cadres vaut 144 % de l'avatar, pour contenir le halo. */
const LAYER_OVERFLOW = '-22%'

function Layer({ src, className, duration }: { src: string; className?: string; duration?: number }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute max-w-none ${className ?? ''}`}
      style={
        {
          inset: LAYER_OVERFLOW,
          width: '144%',
          height: '144%',
          '--jo-frame-duration': duration ? `${duration}ms` : undefined,
        } as CSSProperties
      }
    />
  )
}

export type RankFrameProps = {
  tier: TierCode
  /** Largeur de l'avatar en px, hors halo. */
  size: number
  className?: string
  children: ReactNode
}

/** Cadre Elo en SVG : se gagne en duel classé, de l'anneau plein du Fer à l'irisé du Diamant. */
export function RankFrame({ tier, size, className, children }: RankFrameProps) {
  const { inset, spin, counter, pulse } = FRAMES[tier]
  const slug = tier.toLowerCase()
  const base = `/brand/frame/frame-${slug}`

  return (
    <span className={`relative inline-block flex-none ${className ?? ''}`} style={{ width: size, height: size }}>
      {tier === 'FER' ? (
        <span className="absolute inset-0 rounded-jo-full" style={{ backgroundColor: tierColor(tier) }} />
      ) : (
        <>
          {pulse && <Layer src={`${base}-halo.svg`} className="jo-frame-pulse" />}
          <Layer src={`${base}.svg`} />
          {spin && <Layer src={`${base}-spin.svg`} className="jo-frame-spin" duration={spin} />}
          {counter && <Layer src={`${base}-counter.svg`} className="jo-frame-counter" duration={counter} />}
        </>
      )}
      <span className="absolute overflow-hidden rounded-jo-full" style={{ inset: `${inset * 100}%` }}>
        {children}
      </span>
    </span>
  )
}
