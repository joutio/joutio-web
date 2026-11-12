import type { Icon } from '@phosphor-icons/react'
import { TierMedal } from '../brand/tier-medal'
import { cn } from '../lib/cn'
import { tierInk } from '../lib/tokens'
import { tokens, type TierCode } from '../tokens.generated'
import { ProgressBar } from './progress-bar'

const TIERS = Object.keys(tokens.tier) as TierCode[]

export type BadgeFamilyRowProps = {
  name: string
  icon: Icon
  /** Nombre de paliers acquis, de 0 à 7 : le dernier s'affiche à droite (Fer, Bronze… Diamant). */
  earned: number
  /** Avancement vers le palier suivant, en %. */
  progress: number
  /** Ce qui reste avant le palier suivant, au-dessus de la barre, comme `TitleRow` : « Encore 70 réponses rapides ». */
  remaining?: string
  /**
   * Famille sans échelle (Exploits, 2026-11-12) : hauts faits ponctuels, chacun à son palier, acquis dans n'importe quel
   * ordre. Seules leurs médailles s'affichent, le compte à droite (« 2 / 4 »), sans barre ni « Encore ». `earned` et
   * `progress` sont alors ignorés.
   */
  feats?: readonly { tier: TierCode; earned: boolean }[]
  /** Toute la ligne ouvre la fiche de la famille. */
  onClick?: () => void
  className?: string
}

/**
 * Une famille de badges et ses 7 paliers : à droite le dernier palier acquis, dans sa couleur ; sous les médailles, ce
 * qui reste avant le palier suivant puis la barre (2026-11-12, comme `TitleRow`).
 */
export function BadgeFamilyRow({ name, icon, earned, progress, remaining, feats, onClick, className }: BadgeFamilyRowProps) {
  const featCount = feats ? `${feats.filter((feat) => feat.earned).length} / ${feats.length}` : undefined
  const next = feats ? undefined : TIERS[earned]
  const reached = !feats && earned > 0 ? TIERS[earned - 1] : undefined
  const summary = [name, featCount, reached ? tokens.tier[reached].label : undefined, next ? remaining : undefined].filter(Boolean).join(', ')
  return (
    <div className={cn('relative grid gap-3 overflow-hidden rounded-jo-lg bg-jo-surface px-4 pt-3 pb-4', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <strong className="jo-type-headline truncate">{name}</strong>
        {featCount && <span className="jo-type-caption font-semibold whitespace-nowrap text-jo-muted">{featCount}</span>}
        {reached && (
          <span className="jo-type-caption font-semibold whitespace-nowrap" style={{ color: tierInk(reached) }}>
            {tokens.tier[reached].label}
          </span>
        )}
      </div>
      {feats ? (
        <div className="flex gap-4" aria-hidden>
          {feats.map((feat, index) => (
            <TierMedal key={index} tier={feat.tier} icon={icon} size={40} state={feat.earned ? 'earned' : 'locked'} />
          ))}
        </div>
      ) : (
        <div className="flex justify-between" aria-hidden>
          {TIERS.map((tier, index) => (
            <TierMedal key={tier} tier={tier} icon={icon} size={40} state={index < earned ? 'earned' : 'locked'} />
          ))}
        </div>
      )}
      {next && <ProgressBar value={progress} tone={next} label={remaining} ariaLabel={`${name} · vers ${tokens.tier[next].label}`} />}
      {/* Posé sur la ligne : un bouton ne peut pas contenir les médailles et la barre. */}
      {onClick && <button type="button" aria-label={summary} onClick={onClick} className="jo-transition jo-focus-inset absolute inset-0 cursor-pointer rounded-jo-lg jo-pressed:bg-jo-text/5" />}
    </div>
  )
}
