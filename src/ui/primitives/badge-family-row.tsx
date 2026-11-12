import type { Icon } from '@phosphor-icons/react'
import { TierMedal } from '../brand/tier-medal'
import { cn } from '../lib/cn'
import { tokens, type TierCode } from '../tokens.generated'
import { ProgressBar } from './progress-bar'

const TIERS = Object.keys(tokens.tier) as TierCode[]

export type BadgeFamilyRowProps = {
  name: string
  icon: Icon
  /** Avancement, par exemple `Or · 30 / 100`. */
  meta: string
  /** Nombre de paliers acquis, de 0 à 7. */
  earned: number
  /** Avancement vers le palier suivant, en %. */
  progress: number
  /** Toute la ligne ouvre la fiche de la famille. */
  onClick?: () => void
  className?: string
}

/** Une famille de badges et ses 7 paliers. */
export function BadgeFamilyRow({ name, icon, meta, earned, progress, onClick, className }: BadgeFamilyRowProps) {
  const next = TIERS[earned]
  return (
    <div className={cn('relative grid gap-3 overflow-hidden rounded-jo-lg bg-jo-surface px-4 pt-3 pb-4', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <strong className="jo-type-headline truncate">{name}</strong>
        <span className="jo-type-caption whitespace-nowrap text-jo-muted">{meta}</span>
      </div>
      <div className="flex justify-between" aria-hidden>
        {TIERS.map((tier, index) => (
          <TierMedal key={tier} tier={tier} icon={icon} size={40} state={index < earned ? 'earned' : 'locked'} />
        ))}
      </div>
      {next && <ProgressBar value={progress} tone={next} ariaLabel={`${name} · vers ${tokens.tier[next].label}`} />}
      {/* Posé sur la ligne : un bouton ne peut pas contenir les médailles et la barre. */}
      {onClick && <button type="button" aria-label={`${name}, ${meta}`} onClick={onClick} className="jo-transition jo-focus-inset absolute inset-0 cursor-pointer rounded-jo-lg jo-pressed:bg-jo-text/5" />}
    </div>
  )
}
