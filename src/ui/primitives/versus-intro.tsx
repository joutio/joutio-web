import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor, tierColor } from '../lib/tokens'
import { tokens, type CategoryCode, type TierCode } from '../tokens.generated'
import { Avatar } from './avatar'
import { Badge } from './badge'
import { Pill } from './pill'
import { PlayerName } from './player-name'

export type VersusPlayer = {
  name: string
  tier?: TierCode
  src?: string
  /** Titre porté. */
  title?: string
  /** Elo : avec `tier`, pastille de palier « Or · 867 » comme sur Profil ; sans palier (provisoire), « Non classé ». */
  rating?: number
  /** Pays déjà formaté (« 🇫🇷 France »), en pastille neutre comme sur Profil. */
  country?: string
  /** Texte libre en pastille neutre (« Entraînement » contre le bot). */
  detail?: string
  premium?: boolean
}

export type VersusIntroProps = {
  me: VersusPlayer
  opponent: VersusPlayer
  topic: string
  category: CategoryCode
  rounds: number
  /** Joue la séquence complète, 4 s, jusqu'à l'ouverture des volets. Sans animation : l'état tenu. */
  animated?: boolean
  /** Fin de la séquence, y compris en mouvement réduit : l'écran démonte alors le composant. */
  onComplete?: () => void
  className?: string
}

function Panel({ player, side, animated }: { player: VersusPlayer; side: 'top' | 'bottom'; animated: boolean }) {
  const top = side === 'top'
  const glow = player.tier ? tierColor(player.tier) : 'var(--jo-accent)'
  return (
    <div
      className={cn('absolute inset-x-0 overflow-hidden', top ? 'top-0 bottom-1/2 bg-jo-surface' : 'top-1/2 bottom-0 bg-jo-bg', animated && `jo-versus-${side}`)}
      style={{ backgroundImage: `radial-gradient(circle at ${top ? '10% 90%' : '90% 10%'}, color-mix(in oklab, ${glow} 20%, transparent), transparent 65%)` }}
    >
      <div
        className={cn(
          'absolute inset-x-6 flex items-center gap-4',
          animated && (top ? 'jo-versus-player-me' : 'jo-versus-player-opponent'),
          top ? 'top-[calc(var(--jo-safe-top,0px)+40px)]' : 'bottom-[calc(var(--jo-safe-bottom,0px)+40px)] flex-row-reverse text-right',
        )}
      >
        <Avatar name={player.name} src={player.src} tier={player.tier} size="xxl" className="flex-none" />
        <div className="grid min-w-0 gap-1">
          <PlayerName as="span" name={player.name} premium={player.premium} badgeSize={22} className={cn('jo-type-title-2 font-bold', !top && 'justify-end')} />
          {player.title && <span className="jo-type-caption truncate text-jo-muted">{player.title}</span>}
          {(player.rating !== undefined || player.country || player.detail) && (
            <div className={cn('flex flex-wrap gap-2', !top && 'justify-end')}>
              {player.rating !== undefined &&
                (player.tier ? (
                  <Badge variant="tier" tier={player.tier}>{`${tokens.tier[player.tier].label} · ${player.rating}`}</Badge>
                ) : (
                  <Pill>Non classé</Pill>
                ))}
              {player.country && <Pill>{player.country}</Pill>}
              {player.detail && <Pill>{player.detail}</Pill>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Face-à-face plein écran avant la première manche. Toujours sombre. */
export function VersusIntro({ me, opponent, topic, category, rounds, animated = false, onComplete, className }: VersusIntroProps) {
  return (
    <div
      data-jo-theme="dark"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onComplete?.()
      }}
      className={cn('relative h-full overflow-hidden text-jo-text', animated ? 'jo-versus-clock' : 'bg-jo-bg', className)}
    >
      <Panel player={me} side="top" animated={animated} />
      <Panel player={opponent} side="bottom" animated={animated} />
      <div className={cn('absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-jo-accent', animated && 'jo-versus-seam')} />
      <div className="absolute top-1/2 left-1/2 size-[76px] -translate-x-1/2 -translate-y-1/2">
        {animated && <span className="jo-versus-ring absolute inset-0 rounded-jo-full ring-2 ring-jo-accent" />}
        <div className={cn('jo-type-title-2 grid size-full place-items-center rounded-jo-full bg-jo-accent font-bold text-jo-on-accent ring-8 ring-jo-accent/15', animated && 'jo-versus-disc')}>
          VS
        </div>
      </div>
      <div className="absolute inset-x-0 top-[calc(50%+54px)] flex justify-center">
        <span className={cn('jo-type-caption inline-flex items-center gap-2 rounded-jo-full bg-jo-raised py-1 pr-3 pl-1 font-semibold', animated && 'jo-versus-chip')}>
          <span className="grid size-6 flex-none place-items-center rounded-jo-full text-jo-on-accent" style={{ backgroundColor: categoryColor(category) }}>
            <CategoryIcon category={category} size={12} weight="fill" />
          </span>
          {topic} · {rounds} manches
        </span>
      </div>
    </div>
  )
}
