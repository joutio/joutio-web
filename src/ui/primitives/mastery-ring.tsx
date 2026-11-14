import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
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
  /**
   * Écran court (iPhone Duo plié, 2026-11-14) : libellés empilés à droite de l'anneau, sans traits, pour tenir à côté
   * de l'Elo.
   */
  compact?: boolean
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

/**
 * Place prise par un libellé rayonnant au-delà de l'anneau, de chaque côté (trait, point, « Avant Platine » / « +130 »),
 * marge de page déduite : il peut déborder dans la gouttière de 16 px, jamais hors de l'écran.
 */
const LABEL_REACH = 100

/** Largeur disponible, suivie au redimensionnement (0 avant la première mesure). */
function useWidth(ref: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(element.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/**
 * Maîtrise du sujet après la partie : XP gagnée (arc ambre) et XP restante avant le palier suivant. Libellés de part et
 * d'autre de l'anneau ; trop étroit pour eux (Galaxy S24, 2026-11-14), ils s'empilent à sa droite, anneau inchangé.
 */
export function MasteryRing({ tier, next, gained, remaining, size = 180, state = 'done', compact = false, className }: MasteryRingProps) {
  const pending = state === 'pending'
  const root = useRef<HTMLDivElement>(null)
  const width = useWidth(root)
  const narrow = width > 0 && width < size + 2 * LABEL_REACH
  const progress = useCountUp(`${gained}/${remaining}`, pending)

  const total = gained + remaining
  const shownGained = Math.round(gained * progress)
  const percent = pending ? 0 : (total > 0 ? (gained / total) * 100 : 100) * progress
  const rad = Math.PI / 180
  const gainedAngle = Math.max(36, 1.8 * percent) * rad
  const remainingAngle = Math.max(216, 180 + 1.8 * percent) * rad
  const line = Math.round(size * 0.14)
  const opacity = pending ? 0 : Math.min(1, progress / 0.25)
  const label = pending ? `Maîtrise ${tier}, points d'expérience en cours de calcul` : `Maîtrise ${tier}, ${gained} points d'expérience gagnés, ${next ? `${remaining} avant ${next}` : 'palier max'}`
  const ring = (
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
        <strong className={compact ? 'jo-type-headline font-bold' : 'jo-type-title-2 font-bold'}>{tier}</strong>
      </div>
    </div>
  )

  const stacked = (
    <>
      {ring}
      <div className="grid gap-2" style={{ opacity }}>
          <div className="text-jo-accent-ink">
            <div className="jo-type-caption font-semibold whitespace-nowrap">XP gagnée</div>
            <div className="jo-type-title-2 font-mono font-semibold">+{shownGained}</div>
          </div>
          <div>
            <div className="jo-type-caption font-semibold whitespace-nowrap">{next ? `Avant ${next}` : 'Palier max'}</div>
            <div className="jo-type-title-2 font-mono font-semibold">{total - shownGained}</div>
          </div>
      </div>
    </>
  )

  // Forcé (écran court, à côté de l'Elo) : la rangée seule, à sa largeur.
  if (compact)
    return (
      <div role="img" aria-label={label} className={cn('flex items-center gap-3', className)}>
        {stacked}
      </div>
    )

  // Trop étroit pour les libellés rayonnants : même rangée, centrée ; la mesure reste sur toute la largeur.
  if (narrow)
    return (
      <div ref={root} role="img" aria-label={label} className={cn('flex w-full items-center justify-center gap-4', className)} style={{ height: size }}>
        {stacked}
      </div>
    )

  return (
    <div
      ref={root}
      role="img"
      aria-label={label}
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
      {ring}
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
