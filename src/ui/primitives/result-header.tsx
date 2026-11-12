import { LightningIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Avatar, type AvatarProps } from './avatar'
import { PlayerLink, PlayerName } from './player-name'
import type { MatchOutcome } from './match-row'
import { RoundDots, type RoundResult } from './round-dots'

const OUTCOMES: Record<MatchOutcome, { label: string; className: string; me: string; opponent: string }> = {
  win: { label: 'Victoire', className: 'text-jo-accent-ink', me: 'text-jo-correct', opponent: 'text-jo-wrong' },
  loss: { label: 'Défaite', className: 'text-jo-text', me: 'text-jo-wrong', opponent: 'text-jo-correct' },
  draw: { label: 'Égalité', className: 'text-jo-text', me: 'text-jo-text', opponent: 'text-jo-text' },
  forfeit: { label: 'Abandon', className: 'text-jo-muted', me: 'text-jo-muted', opponent: 'text-jo-muted' },
}

export type ResultPlayer = Pick<AvatarProps, 'src' | 'tier'> & {
  name: string
  score: number
  /** Résultat de chaque manche, une pastille par entrée. */
  streak: readonly RoundResult[]
  /** Ligne sous le nom, par exemple `Elo 856 · non classé`. */
  meta?: string
  /** `PremiumBadge` après le pseudonyme. */
  premium?: boolean
  /** Avatar et pseudonyme ouvrent la fiche du joueur. */
  onOpen?: () => void
}

function PlayerLabel({ player }: { player: ResultPlayer }) {
  return (
    <div className="grid min-w-0 justify-items-center gap-1 text-center">
      <PlayerLink onOpen={player.onOpen} name={player.name} className="flex justify-center">
        <PlayerName name={player.name} premium={player.premium} className="jo-type-headline justify-center" />
      </PlayerLink>
      {player.meta && <span className="jo-type-caption whitespace-nowrap text-jo-muted">{player.meta}</span>}
      <RoundDots results={player.streak} size={10} className="mt-1" />
    </div>
  )
}

export type ResultHeaderProps = {
  outcome: MatchOutcome
  topic: string
  me: ResultPlayer
  opponent: ResultPlayer
  className?: string
}

export function ResultHeader({ outcome, topic, me, opponent, className }: ResultHeaderProps) {
  const { label, className: outcomeClass, me: myScore, opponent: opponentScore } = OUTCOMES[outcome]
  return (
    <div className={cn('grid w-full gap-4', className)}>
      <div className="grid justify-items-center gap-1 text-center">
        <h1 className={cn('jo-type-hero', outcomeClass)}>{label}</h1>
        <span className="jo-type-callout text-jo-muted">{topic}</span>
      </div>
      <div className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3">
        <PlayerLink onOpen={me.onOpen} name={me.name} className="rounded-jo-full">
          <Avatar name={me.name} src={me.src} tier={me.tier} size="xl" />
        </PlayerLink>
        <div role="img" className="@container min-w-0" aria-label={`Score : ${me.score} à ${opponent.score}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <strong className={cn('jo-type-numeric-large jo-result-score justify-self-start', myScore)}>{me.score}</strong>
            <LightningIcon size={24} weight="fill" className="text-jo-accent-ink" aria-hidden />
            <strong className={cn('jo-type-numeric-large jo-result-score justify-self-end', opponentScore)}>{opponent.score}</strong>
          </div>
        </div>
        <PlayerLink onOpen={opponent.onOpen} name={opponent.name} className="rounded-jo-full">
          <Avatar name={opponent.name} src={opponent.src} tier={opponent.tier} size="xl" />
        </PlayerLink>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <PlayerLabel player={me} />
        <span className="jo-type-caption pt-1 font-semibold text-jo-muted">vs</span>
        <PlayerLabel player={opponent} />
      </div>
    </div>
  )
}
