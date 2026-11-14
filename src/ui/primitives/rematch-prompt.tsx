import { useEffect, useId, useRef } from 'react'
import { trapTab } from '../lib/focus'
import { cn } from '../lib/cn'
import type { TierCode } from '../tokens.generated'
import { PremiumBadge } from '../brand/premium-badge'
import { Avatar } from './avatar'
import { Button } from './button'
import { isTimerUrgent } from './timer-bar'

export type RematchPromptProps = {
  name: string
  premium?: boolean
  tier?: TierCode
  src?: string
  topic: string
  /** Secondes restantes, calculées par l'appelant. */
  seconds: number
  /** Délai de la proposition. */
  total?: number
  /** Force l'état urgent, comme `TimerBar` `low`. */
  low?: boolean
  /** Sous ce seuil, l'anneau et le décompte passent en rouge. */
  lowAt?: number
  onAccept?: () => void
  onDecline?: () => void
  className?: string
}

/** Proposition de revanche, posée par l'écran au-dessus d'un voile. */
export function RematchPrompt({ name, premium = false, tier, src, topic, seconds, total = 10, low = false, lowAt = 3, onAccept, onDecline, className }: RematchPromptProps) {
  // L'anneau vise la fin de la seconde en cours (transition linéaire de 1 s) : il se vide en continu, sans saut au tic.
  const percent = Math.min(100, Math.max(0, ((seconds - 1) / total) * 100))
  // Même règle que `TimerBar` et `DuelHeader`.
  const urgent = isTimerUrgent(seconds, low ? 'low' : 'running', lowAt)
  const ring = urgent ? 'var(--jo-wrong)' : 'var(--jo-accent)'
  const topicId = useId()
  const card = useRef<HTMLDivElement>(null)

  // Comme un Dialog : « Accepter » prend le focus, qui revient à l'élément d'origine à la fermeture.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    // « Accepter » est la dernière action de la carte.
    const actions = card.current?.querySelectorAll<HTMLElement>('button')
    actions?.[actions.length - 1]?.focus({ preventScroll: true })
    return () => opener?.focus({ preventScroll: true })
  }, [])
  return (
    <div ref={card} role="alertdialog" aria-modal="true" aria-label={`${name} veut sa revanche`} aria-describedby={topicId} onKeyDown={trapTab} className={cn('grid justify-items-center gap-3 rounded-jo-xl bg-jo-surface px-4 pt-6 pb-4 text-center shadow-jo', className)}>
      <div className="relative grid size-[120px] place-items-center">
        <span
          aria-hidden
          className="jo-rematch-ring absolute inset-0 rounded-jo-full"
          style={{ ['--jo-rematch-color' as string]: ring, ['--jo-rematch-percent' as string]: percent }}
        />
        <span aria-hidden className="absolute inset-[5px] rounded-jo-full bg-jo-surface" />
        <Avatar name={name} src={src} tier={tier} size="xxl" className="relative" />
      </div>
      <span role="timer" aria-label={`${seconds} ${seconds > 1 ? 'secondes' : 'seconde'} pour répondre`} className={cn('jo-type-caption font-mono', urgent ? 'font-semibold text-jo-wrong' : 'text-jo-muted')}>
        {seconds} s
      </span>
      <strong className="jo-type-title-2 text-balance">
        {name}
        {premium && <PremiumBadge size={22} className="ml-1 align-[-3px]" />} veut sa revanche
      </strong>
      <span id={topicId} className="jo-type-callout text-jo-muted">Même sujet : {topic}</span>
      <div className="mt-2 grid w-full grid-cols-2 gap-2">
        <Button variant="tinted" tone="destructive" full onClick={onDecline}>
          Refuser
        </Button>
        <Button full onClick={onAccept}>
          Accepter
        </Button>
      </div>
    </div>
  )
}
