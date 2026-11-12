import { ClockIcon, LightningIcon, UserPlusIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import type { TierCode } from '../tokens.generated'
import { Avatar } from './avatar'

export type RoomPlayer = {
  name: string
  tier?: TierCode
  src?: string
  /** État sous le nom ; « Dans le salon » (présent) ou « Pas encore là » (absent) par défaut. */
  status?: string
  /** Pas encore arrivé : avatar estompé, horloge, état en gris (2026-11-07). */
  away?: boolean
}

export type RoomPlayersProps = {
  me: RoomPlayer
  /** Absent : place libre (salon partagé sans second joueur). */
  opponent?: RoomPlayer
  className?: string
}

function Seat({ player }: { player: RoomPlayer }) {
  const away = player.away ?? false
  return (
    <div className="grid min-w-0 justify-items-center gap-2 text-center">
      <span className={cn('relative', away && 'opacity-45')}>
        <Avatar name={player.name} src={player.src} tier={player.tier} size="xxl" />
        <span
          className={cn(
            'absolute right-0 bottom-0 grid size-7 place-items-center rounded-jo-full border-3 border-jo-bg',
            away ? 'bg-jo-raised text-jo-muted' : 'bg-jo-correct text-jo-bg',
          )}
          aria-hidden
        >
          {away ? <ClockIcon size={14} weight="bold" /> : <LightningIcon size={14} weight="fill" />}
        </span>
      </span>
      <strong className="jo-type-headline max-w-full truncate">{player.name}</strong>
      <span className={cn('jo-type-caption font-semibold', away ? 'text-jo-muted' : 'text-jo-correct')}>
        {player.status ?? (away ? 'Pas encore là' : 'Dans le salon')}
      </span>
    </div>
  )
}

/** Face-à-face du salon : présence de chacun, place encore libre, éclair vert quand les deux sont là. */
export function RoomPlayers({ me, opponent, className }: RoomPlayersProps) {
  const ready = Boolean(opponent) && !me.away && !opponent?.away
  return (
    <div
      aria-label={ready ? 'Les deux joueurs sont là' : undefined}
      className={cn('grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3', className)}
    >
      <Seat player={me} />
      <span className={cn('mt-[30px] grid size-7 place-items-center rounded-jo-full', ready ? 'bg-jo-correct text-jo-bg' : 'bg-jo-raised text-jo-muted')} aria-hidden>
        <LightningIcon size={14} weight="fill" />
      </span>
      {opponent ? (
        <Seat player={opponent} />
      ) : (
        <div className="grid min-w-0 justify-items-center gap-2 text-center">
          <span className="grid size-[88px] place-items-center rounded-jo-full border-2 border-dashed border-jo-border text-jo-muted">
            <UserPlusIcon size={30} aria-hidden />
          </span>
          <strong className="jo-type-headline text-jo-muted">En attente</strong>
          <span className="jo-type-caption text-jo-muted">Le duel démarre à deux</span>
        </div>
      )}
    </div>
  )
}
