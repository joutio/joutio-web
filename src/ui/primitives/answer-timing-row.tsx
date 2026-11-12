import { cn } from '../lib/cn'

export type AnswerTiming = {
  name: string
  /** Temps de réponse. Absent : pas de réponse. */
  seconds?: number
  points: number
}

export type AnswerTimingRowProps = {
  me: AnswerTiming
  opponent: AnswerTiming
  /** Premier à avoir répondu. */
  first?: 'me' | 'opponent'
  className?: string
}

const duration = (seconds: number) => `${seconds.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`

function Timing({ player, first, end }: { player: AnswerTiming; first: boolean; end?: boolean }) {
  const time = player.seconds === undefined ? 'sans réponse' : duration(player.seconds)
  const points = player.points > 0 ? `+${player.points}` : `${player.points}`
  return (
    <span className={cn('grid min-w-0', end && 'text-right', first && 'text-jo-accent-ink')}>
      <span className="truncate font-semibold">
        {first && '1er · '}
        {player.name}
      </span>
      <span className="whitespace-nowrap">
        {time} · {points}
      </span>
    </span>
  )
}

/** Temps et gain de chaque joueur sur une manche. */
export function AnswerTimingRow({ me, opponent, first, className }: AnswerTimingRowProps) {
  return (
    <div className={cn('jo-type-caption grid grid-cols-2 gap-3 font-mono text-jo-muted', className)}>
      <Timing player={me} first={first === 'me'} />
      <Timing player={opponent} first={first === 'opponent'} end />
    </div>
  )
}
