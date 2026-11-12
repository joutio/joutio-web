import { LightningIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Avatar, type AvatarProps } from './avatar'
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
}

function PlayerName({ player }: { player: ResultPlayer }) {
  return (
    <div className="grid min-w-0 justify-items-center gap-1 text-center">
      <strong className="jo-type-headline max-w-full truncate">{player.name}</strong>
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
        <Avatar name={me.name} src={me.src} tier={me.tier} size="xl" />
        <div role="img" className="@container min-w-0" aria-label={`Score : ${me.score} à ${opponent.score}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <strong className={cn('jo-type-numeric-large jo-result-score justify-self-start', myScore)}>{me.score}</strong>
            <LightningIcon size={24} weight="fill" className="text-jo-accent-ink" aria-hidden />
            <strong className={cn('jo-type-numeric-large jo-result-score justify-self-end', opponentScore)}>{opponent.score}</strong>
          </div>
        </div>
        <Avatar name={opponent.name} src={opponent.src} tier={opponent.tier} size="xl" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <PlayerName player={me} />
        <span className="jo-type-caption pt-1 font-semibold text-jo-muted">vs</span>
        <PlayerName player={opponent} />
      </div>
    </div>
  )
}
