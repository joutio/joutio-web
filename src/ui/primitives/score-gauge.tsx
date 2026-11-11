import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'

const FILLS = { rest: 'bg-jo-accent', correct: 'bg-jo-correct', wrong: 'bg-jo-wrong' }

export type ScoreGaugeProps = {
  value: number
  /** Valeur de départ à l'affichage : la jauge monte de `from` à `value`. */
  from?: number
  /** Score maximal de la partie. */
  max: number
  state?: keyof typeof FILLS
  label?: string
  className?: string
}

/** Jauge verticale : prend toute la hauteur de son parent, comme TimerBar sa largeur. */
export function ScoreGauge({ value, from, max, state = 'rest', label = 'Score', className }: ScoreGaugeProps) {
  const bounded = Math.min(max, Math.max(0, value))
  const [shown, setShown] = useState(Math.min(max, Math.max(0, from ?? value)))

  // Une image d'écart : le navigateur doit d'abord peindre le départ pour jouer la transition.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(bounded))
    return () => cancelAnimationFrame(frame)
  }, [bounded])

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('relative h-full w-2 flex-none overflow-hidden', className)}
    >
      <div className={cn('jo-gauge-fill absolute inset-x-0 bottom-0', FILLS[state])} style={{ height: `${(shown / max) * 100}%` }} />
    </div>
  )
}
