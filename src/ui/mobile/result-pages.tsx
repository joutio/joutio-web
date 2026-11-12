import { useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react'
import { cn } from '../lib/cn'

/** Courbe et durée de la bascule, celles du mobile (`result-pages.tsx`, 450 ms amortis). */
const SWITCH = 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)'
/** Glissé minimal avant de décider de l'axe, en px. */
const AXIS_SLOP = 8
/** Deux crans de molette à moins de cet intervalle ne font qu'une bascule. */
const WHEEL_COOLDOWN_MS = 600

type Drag = { id: number; x: number; y: number; axis: 'x' | 'y' | null; dy: number }

export type ResultPagesProps = {
  /** Page affichée : 0 résultat, 1 Détails du duel. */
  page: 0 | 1
  onPageChange: (page: 0 | 1) => void
  /** Faux : une seule page, aucun geste. */
  enabled: boolean
  children: [ReactNode, ReactNode]
}

/**
 * Pager vertical du résultat (`resultat.md` § 6, comme `joutio-mobile`) : deux pages fixes sous la barre du haut. Le
 * doigt (ou la souris) déplace les pages ; au relâcher, tout glissé vertical bascule dans sa direction, sans seuil ni
 * condition de vitesse (décision du 2026-11-10). Un glissé d'abord horizontal reste au carrousel des questions. La
 * molette bascule aussi. La page hors écran est inerte.
 */
export function ResultPages({ page, onPageChange, enabled, children }: ResultPagesProps) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const wheelAt = useRef(0)
  const [offset, setOffset] = useState<number | null>(null)
  const [first, second] = children
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null, dy: 0 }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (current.axis === null) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return
      current.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
      if (current.axis === 'y') event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (current.axis !== 'y') return
    const height = root.current?.clientHeight ?? 0
    // Page 0 : vers le haut seulement ; page 1 : vers le bas seulement.
    current.dy = page === 0 ? Math.max(-height, Math.min(0, dy)) : Math.min(height, Math.max(0, dy))
    setOffset(current.dy)
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    setOffset(null)
    if (current.axis !== 'y' || current.dy === 0) return
    onPageChange(current.dy < 0 ? 1 : 0)
  }
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!enabled || Math.abs(event.deltaY) < 10 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
    const now = Date.now()
    if (now - wheelAt.current < WHEEL_COOLDOWN_MS) return
    const next = event.deltaY > 0 ? 1 : 0
    if (next === page) return
    wheelAt.current = now
    onPageChange(next)
  }

  const base = enabled ? page * -50 : 0
  return (
    <div
      ref={root}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onWheel={onWheel}
      className={cn('relative h-full overflow-hidden', enabled && 'touch-none select-none')}
    >
      <div
        className="flex flex-col will-change-transform"
        style={{
          height: enabled ? '200%' : '100%',
          transform: `translateY(calc(${base}% + ${offset ?? 0}px))`,
          transition: offset !== null || reduced ? 'none' : SWITCH,
        }}
      >
        <section aria-hidden={page !== 0} inert={page !== 0} className={cn('min-h-0', enabled ? 'h-1/2' : 'h-full')}>
          {first}
        </section>
        {enabled && (
          <section aria-hidden={page !== 1} inert={page !== 1} className="h-1/2 min-h-0">
            {second}
          </section>
        )}
      </div>
    </div>
  )
}
