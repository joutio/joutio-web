import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'

const CIRCUMFERENCE = 408.41
const COUNT_DURATION = 1600

export type MasteryRingProps = {
  /** Palier affiché au centre. */
  tier: string
  /** Palier suivant. Absent au palier maximal. */
  next?: string
  gained: number
  remaining: number
  /** Diamètre en px. */
  size?: number
  /** `pending` : XP pas encore connue, l'anneau reste vide. */
  state?: 'pending' | 'done'
  className?: string
}

/**
 * Progression de l'animation : l'affichage seul, les valeurs viennent des props. Écart avec le lab : les états fixes
 * (en attente, mouvement réduit) sont dérivés au rendu, l'effet ne pilote que l'animation (règle `set-state-in-effect`).
 */
function useCountUp(key: string, pending: boolean) {
  const [progress, setProgress] = useState(0)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (pending || reduced) return
    let frame = 0
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const value = Math.min(1, (now - start) / COUNT_DURATION)
      setProgress(value)
      if (value < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [key, pending, reduced])

  return pending ? 0 : reduced ? 1 : progress
}

export function MasteryRing({ tier, next, gained, remaining, size = 180, state = 'done', className }: MasteryRingProps) {
  const pending = state === 'pending'
  const root = useRef<HTMLDivElement>(null)
  const progress = useCountUp(`${gained}/${remaining}`, pending)

  const total = gained + remaining
  const shownGained = Math.round(gained * progress)
  const percent = pending ? 0 : (total > 0 ? (gained / total) * 100 : 100) * progress
  const rad = Math.PI / 180
  const gainedAngle = Math.max(36, 1.8 * percent) * rad
  const remainingAngle = Math.max(216, 180 + 1.8 * percent) * rad
  const line = Math.round(size * 0.14)
  const opacity = pending ? 0 : Math.min(1, progress / 0.25)

  return (
    <div
      ref={root}
      role="img"
      aria-label={pending ? `Maîtrise ${tier}, XP en cours de calcul` : `Maîtrise ${tier}, ${gained} XP gagnés, ${next ? `${remaining} avant ${next}` : 'palier max'}`}
      className={cn('relative flex w-full justify-center', className)}
      style={{ height: size }}
    >
      <div
        className="absolute flex -translate-y-1/2 items-center"
        style={{ right: `calc(50% + ${(size * -0.5 * Math.sin(remainingAngle)).toFixed(1)}px)`, top: `${((1 - Math.cos(remainingAngle)) * 50).toFixed(1)}%`, opacity }}
      >
        <div className="mr-2 text-right">
          <div className="jo-type-caption font-semibold whitespace-nowrap">{next ? `Avant ${next}` : 'Palier max'}</div>
          <div className="jo-type-large-title font-mono font-semibold">{total - shownGained}</div>
        </div>
        <span className="size-[7px] rounded-jo-full bg-jo-text" />
        <span className="h-0.5 bg-jo-text" style={{ width: line }} />
      </div>
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" aria-hidden className="size-full -rotate-90">
          <circle cx="80" cy="80" r="65" fill="none" stroke="var(--jo-text)" strokeWidth="30" />
          <circle
            cx="80"
            cy="80"
            r="65"
            fill="none"
            stroke="var(--jo-accent)"
            strokeWidth="30"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={(CIRCUMFERENCE * (1 - percent / 100)).toFixed(2)}
          />
        </svg>
        <div className="absolute inset-0 grid content-center justify-items-center gap-0.5 text-center">
          <span className="jo-type-caption font-semibold text-jo-muted">Maîtrise</span>
          <strong className="jo-type-title-2 font-bold">{tier}</strong>
        </div>
      </div>
      <div
        className="absolute flex -translate-y-1/2 items-center"
        style={{ left: `calc(50% + ${(size * 0.5 * Math.sin(gainedAngle)).toFixed(1)}px)`, top: `${((1 - Math.cos(gainedAngle)) * 50).toFixed(1)}%`, opacity }}
      >
        <span className="h-0.5 bg-jo-accent" style={{ width: line }} />
        <span className="size-[7px] rounded-jo-full bg-jo-accent" />
        <div className="ml-2 text-jo-accent-ink">
          <div className="jo-type-caption font-semibold whitespace-nowrap">XP gagnée</div>
          <div className="jo-type-large-title font-mono font-semibold">+{shownGained}</div>
        </div>
      </div>
    </div>
  )
}
