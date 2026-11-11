import { WifiSlashIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Notice } from './notice'
import { Button } from './button'

export type ReconnectCountdownProps = {
  variant?: 'lost' | 'expired'
  /** Secondes restantes de la manche, calculées par l'appelant. */
  seconds?: number
  opponent: string
  round: number
  total: number
  onAbandon?: () => void
  onReconnect?: () => void
  className?: string
}

/** Perte de réseau pendant une manche. Le duel reprend seul. Toujours sombre. */
export function ReconnectCountdown({ variant = 'lost', seconds = 0, opponent, round, total, onAbandon, onReconnect, className }: ReconnectCountdownProps) {
  const lost = variant === 'lost'
  return (
    <div
      data-jo-theme="dark"
      className={cn('flex h-full flex-col gap-6 bg-jo-bg px-6 pt-[calc(var(--jo-safe-top,0px)+48px)] pb-[calc(var(--jo-safe-bottom,0px)+16px)] text-jo-text', className)}
    >
      <div className="grid flex-1 place-items-center">
        <div className="grid justify-items-center gap-3 text-center">
          <WifiSlashIcon size={40} className="text-jo-wrong" aria-hidden />
          {lost && (
            <div role="timer" aria-label={`${seconds} ${seconds > 1 ? 'secondes restantes' : 'seconde restante'} dans la manche`} className="grid justify-items-center gap-3">
              <span className="jo-type-numeric-giant">{seconds}</span>
              <span className="jo-type-callout text-jo-muted">{seconds > 1 ? 'secondes' : 'seconde'}</span>
            </div>
          )}
          <span className="jo-type-title-2 font-bold">{lost ? 'Connexion perdue' : 'Ta session a expiré'}</span>
          <span className="jo-type-callout max-w-[300px] text-pretty text-jo-muted">
            {lost
              ? 'Le duel reprend tout seul dès que le réseau revient. Sans retour à temps, la manche compte comme sans réponse.'
              : 'Reconnecte-toi pour reprendre le duel.'}
          </span>
        </div>
      </div>
      <Notice tone="live" title={`${opponent} t'attend`} message={`Manche ${round} sur ${total}`} />
      {lost ? (
        <Button variant="tinted" tone="destructive" size="L" full onClick={onAbandon}>
          Abandonner le duel
        </Button>
      ) : (
        <Button variant="filled" size="L" full onClick={onReconnect}>
          Se reconnecter
        </Button>
      )}
    </div>
  )
}
