import type { TierCode } from '../tokens.generated'
import { cn } from '../lib/cn'
import { Avatar } from './avatar'
import { isTimerUrgent, type TimerState } from './timer-bar'

const SCORE_STATES = { rest: 'text-jo-accent-ink', correct: 'text-jo-correct', wrong: 'text-jo-wrong' }

export type DuelPlayer = {
  name: string
  score: number
  tier?: TierCode
  src?: string
  /** Couleur du score à la révélation. */
  scoreState?: keyof typeof SCORE_STATES
}

export type DuelHeaderProps = {
  me: DuelPlayer
  opponent: DuelPlayer
  /** Secondes restantes, calculées par l'appelant. */
  seconds: number
  /** État partagé avec `TimerBar`. */
  timerState?: TimerState
  /** Sous ce seuil, le décompte passe en rouge. */
  lowAt?: number
  className?: string
}

function Side({ player, end }: { player: DuelPlayer; end?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', end && 'flex-row-reverse text-right')}>
      <Avatar name={player.name} src={player.src} tier={player.tier} size="list" className="flex-none" />
      <div className="min-w-0">
        <div className="jo-type-callout truncate font-semibold">{player.name}</div>
        <div className={cn('jo-type-numeric-medium', SCORE_STATES[player.scoreState ?? 'rest'])}>{player.score}</div>
      </div>
    </div>
  )
}

/** Haut de l'arène. L'avancement est dans `QuestionBlock` ; `TimerBar` et `ScoreGauge` restent posés par l'écran. */
export function DuelHeader({ me, opponent, seconds, timerState, lowAt, className }: DuelHeaderProps) {
  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 pt-3 pb-2', className)}>
      <Side player={me} />
      <span role="timer" aria-label={`${seconds} secondes restantes`} className={cn('jo-type-numeric-timer jo-transition', isTimerUrgent(seconds, timerState, lowAt) ? 'text-jo-wrong' : 'text-jo-text')}>
        {seconds}
      </span>
      <Side player={opponent} end />
    </div>
  )
}
