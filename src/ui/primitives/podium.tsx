import { CrownSimpleIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { tierColor, tint } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'
import { Avatar } from './avatar'

/** Couleur et hauteur de chaque marche, de la 1re à la 3e place. */
const STEPS: { tier: TierCode; height: number }[] = [
  { tier: 'OR', height: 96 },
  { tier: 'ARGENT', height: 72 },
  { tier: 'BRONZE', height: 56 },
]

export type PodiumPlayer = {
  name: string
  tier?: TierCode
  src?: string
  /** Score, en mono sous le nom. */
  value: string
}

export type PodiumProps = {
  /** Les trois premiers, dans l'ordre du classement. */
  players: readonly PodiumPlayer[]
  className?: string
}

function Step({ player, rank }: { player: PodiumPlayer; rank: number }) {
  const { tier, height } = STEPS[rank - 1] ?? { tier: 'BRONZE' as const, height: 56 }
  const color = tierColor(tier)
  return (
    <li className="grid min-w-0 flex-1 justify-items-center gap-1 text-center">
      <CrownSimpleIcon size={20} weight="fill" style={{ color }} aria-hidden />
      <Avatar name={player.name} src={player.src} tier={player.tier} size="lg" />
      <strong className="jo-type-callout mt-1 max-w-full truncate font-semibold">{player.name}</strong>
      <span className="jo-type-caption font-mono text-jo-muted">{player.value}</span>
      <span className="jo-type-title-2 mt-1 grid w-full place-items-center rounded-t-jo-md font-mono font-bold" style={{ height, backgroundColor: tint(color), color }}>
        {rank}
      </span>
    </li>
  )
}

/** Les trois premiers d'un classement : le 1er au centre, le 2e à gauche, le 3e à droite. */
export function Podium({ players, className }: PodiumProps) {
  const [first, second, third] = players
  return (
    <ol aria-label="Podium" className={cn('m-0 flex list-none items-end gap-2 p-0', className)}>
      {second && <Step player={second} rank={2} />}
      {first && <Step player={first} rank={1} />}
      {third && <Step player={third} rank={3} />}
    </ol>
  )
}
