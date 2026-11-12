import type { Icon } from '@phosphor-icons/react'
import { TierMedal } from '../brand/tier-medal'
import { cn } from '../lib/cn'
import { tokens, type TierCode } from '../tokens.generated'

export type LadderRung = {
  tier: TierCode
  /** Nom de la ligne ; le palier par défaut. Exploits : le nom du haut fait (« Éclair »). */
  title?: string
  /** Condition du palier, en entier (passe à la ligne). */
  rule: string
  /** `Acquis`, avancement ou tiret. */
  status: string
  /** Médaille pleine, sinon verrouillée. */
  earned?: boolean
}

export type RankLadderProps = {
  rungs: readonly LadderRung[]
  /** Icône de la famille de badges, portée par chaque médaille. */
  icon?: Icon
  className?: string
}

/** Les paliers d'un badge, du Fer au Diamant, chacun avec sa médaille. */
export function RankLadder({ rungs, icon, className }: RankLadderProps) {
  return (
    <ul className={cn('m-0 list-none overflow-hidden rounded-jo-md bg-jo-raised p-0 text-left', className)}>
      {rungs.map((rung, index) => (
        <li key={rung.tier} className={cn('flex min-h-16 items-center gap-3 px-4 py-2', index < rungs.length - 1 && 'border-b border-jo-border')}>
          <TierMedal tier={rung.tier} icon={icon} size={44} state={rung.earned ? 'earned' : 'locked'} />
          <span className="grid min-w-0 flex-1">
            <span className="jo-type-body truncate">{rung.title ?? tokens.tier[rung.tier].label}</span>
            <span className="jo-type-caption text-pretty text-jo-muted">{rung.rule}</span>
          </span>
          <span className="jo-type-body whitespace-nowrap text-jo-muted">{rung.status}</span>
        </li>
      ))}
    </ul>
  )
}
