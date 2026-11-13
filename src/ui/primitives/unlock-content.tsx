import { ArrowRightIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { tierColor, tierInk } from '../lib/tokens'
import { tokens, type TierCode } from '../tokens.generated'
import { cn } from '../lib/cn'

/** Au-delà, le titre passe en `heroSmall` pour tenir sur deux lignes. */
const LONG_HEADLINE = 12

/** Couleur d'un déblocage sans rang (série) : halo, fil et mot d'appel. */
export type UnlockAccent = { glow: string; ink: string; label: string }

type UnlockContentProps = {
  /** Rang du déblocage ; sans rang, `accent` donne la couleur et le bout du fil. */
  tier?: TierCode
  accent?: UnlockAccent
  /** Devant le fil, avatar ou icône de famille. */
  crumbLead?: ReactNode
  crumbFrom: string
  hero: ReactNode
  /** Animation d'arrivée du héros. */
  heroMotion: string
  eyebrow: string
  headline: string
  text: string
  /** Action secondaire ou son état, sous la phrase. */
  extra?: ReactNode
  /** Palier suivant : `tier` (son nom en couleur), ou `label` libre pour un déblocage sans rang. */
  next?: { tier?: TierCode; label?: string; preview: ReactNode; rule: string }
}

/**
 * Contenu commun d'un déblocage : halo du rang, fil, héros, titre, texte, action et palier suivant.
 * Les points, « Tout passer », Partager et Continuer appartiennent à `UnlockSequence`.
 */
export function UnlockContent({ tier, accent, crumbLead, crumbFrom, hero, heroMotion, eyebrow, headline, text, extra, next }: UnlockContentProps) {
  const ink = tier ? tierInk(tier) : (accent?.ink ?? 'var(--jo-accent-ink)')
  const glow = tier ? tierColor(tier) : (accent?.glow ?? 'var(--jo-accent)')
  const crumbTo = tier ? tokens.tier[tier].label : (accent?.label ?? '')
  return (
    <div className="relative flex flex-[1_0_auto] flex-col items-center gap-3 px-6 pt-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[258px] left-1/2 -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-jo-full"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${glow} 34%, transparent), color-mix(in oklab, ${glow} 8%, transparent) 45%, transparent 68%)`,
        }}
      />
      <div className="jo-type-caption flex items-center gap-2 font-semibold text-jo-muted">
        {crumbLead}
        {crumbFrom}
        <ArrowRightIcon size={14} aria-hidden />
        <span style={{ color: ink }}>{crumbTo}</span>
      </div>
      <div className={cn('grid h-[236px] flex-none place-items-center', heroMotion)}>{hero}</div>
      <span className="jo-type-callout font-semibold" style={{ color: ink }}>
        {eyebrow}
      </span>
      <h1 className={cn('text-balance', headline.length > LONG_HEADLINE ? 'jo-type-hero-small' : 'jo-type-hero')}>{headline}</h1>
      <p className="jo-type-body max-w-[300px] text-pretty text-jo-muted">{text}</p>
      {extra && <div className="mt-1 grid min-h-8 place-items-center">{extra}</div>}
      <div className="flex-1" />
      {next && (
        <div className="grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-jo-lg bg-jo-surface px-4 py-3 text-left">
          <div className="grid h-14 place-items-center">{next.preview}</div>
          <span className="jo-type-caption text-jo-muted">
            Prochain :{' '}
            <strong className="font-semibold" style={{ color: next.tier ? tierInk(next.tier) : ink }}>
              {next.tier ? tokens.tier[next.tier].label : next.label}
            </strong>{' '}
            {next.rule}
          </span>
        </div>
      )}
    </div>
  )
}
