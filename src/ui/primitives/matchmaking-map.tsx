import { UserIcon } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'
import { tierColor } from '../lib/tokens'
import type { TierCode } from '../tokens.generated'

export type MapPlayer = {
  name: string
  lon: number
  lat: number
  tier?: TierCode
  /** Avatar illustré. Absent : avatar de base, icône sur `color`. */
  src?: string
  /** Fond de l'avatar de base, choisi par le joueur. */
  color?: string
}

export type MatchmakingMapProps = {
  state?: 'search' | 'found'
  /** Joueurs qui apparaissent pendant la recherche. */
  pins?: readonly MapPlayer[]
  /** Adversaire trouvé : la carte s'arrête sur lui. */
  opponent?: MapPlayer & { label?: string }
  /** Vitesse de défilement : 1 fait le tour de la carte en 90 s. */
  speed?: number
  className?: string
}

const LOOP_SECONDS = 90
/** Démarre sur l'Amérique plutôt que sur le Pacifique. */
const START = 0.25

const longitude = (lon: number) => (lon + 180) / 360
const latitude = (lat: number) => (90 - lat) / 180

function Pin({ player, delay, found }: { player: MapPlayer; delay?: number; found?: boolean }) {
  const style: CSSProperties = {
    left: `${longitude(player.lon) * 100}%`,
    top: `${latitude(player.lat) * 100}%`,
    animationDelay: delay === undefined ? undefined : `${delay}ms`,
  }
  return (
    <span style={style} className={cn('jo-map-position absolute h-[60px] w-12', found ? 'jo-celebrate' : 'jo-map-pin')}>
      <span
        style={{ backgroundColor: player.tier ? tierColor(player.tier) : 'var(--jo-accent)' }}
        className="absolute inset-x-0 top-0 h-12 -rotate-45 rounded-[50%_50%_50%_4px] shadow-jo"
      />
      {player.src ? (
        <img src={player.src} alt="" className="absolute top-[5px] left-[5px] size-[38px] rounded-jo-full bg-jo-text object-cover" />
      ) : (
        <span style={{ backgroundColor: player.color }} className="absolute top-[5px] left-[5px] grid size-[38px] place-items-center rounded-jo-full text-jo-on-accent">
          <UserIcon size={22} weight="fill" aria-hidden />
        </span>
      )}
    </span>
  )
}

/** Fond de la recherche d'adversaire. Défile en recherche, s'arrête sur l'adversaire trouvé. */
export function MatchmakingMap({ state = 'search', pins = [], opponent, speed = 3, className }: MatchmakingMapProps) {
  const found = state === 'found' && opponent
  const position = found ? longitude(opponent.lon) : 0
  // Deux copies de 200cqh : on vise celle qui laisse la carte déborder des deux côtés.
  const anchor = position < 0.5 ? position + 1 : position
  return (
    <div role="img" aria-label={found ? `Adversaire trouvé : ${opponent.name}` : 'Carte des joueurs'} className={cn('relative size-full overflow-hidden bg-jo-bg [container-type:size]', className)}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 35%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0.6) 68%, rgba(0, 0, 0, 0.25) 86%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0.6) 68%, rgba(0, 0, 0, 0.25) 86%, transparent 100%)',
        }}
      >
        <div
          className={cn('absolute inset-y-0 left-0 flex w-[400cqh]', !found && 'jo-map-scroll')}
          style={
            found
              ? { transform: `translateX(calc(50cqw - ${anchor} * 200cqh))` }
              : { animationDuration: `${LOOP_SECONDS / speed}s`, animationDelay: `${(-LOOP_SECONDS * START) / speed}s` }
          }
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="relative h-full w-[200cqh] flex-none">
              <div className="jo-map-land absolute inset-0 bg-jo-raised" />
              {found ? (
                <Pin player={opponent} found />
              ) : (
                pins.map((player, index) => <Pin key={player.name} player={player} delay={index * 210} />)
              )}
            </div>
          ))}
        </div>
      </div>
      {found && opponent.label && (
        <span className="jo-type-caption absolute left-1/2 mt-2 -translate-x-1/2 rounded-jo-sm bg-jo-text px-2 py-0.5 font-semibold whitespace-nowrap text-jo-bg" style={{ top: `${latitude(opponent.lat) * 100}%` }}>
          {opponent.label}
        </span>
      )}
    </div>
  )
}
