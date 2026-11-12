import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export type Detent = 'peek' | 'half' | 'full'

export type DetentSheetProps = {
  /** Hauteur des crans `half` et `full`, en fraction de l'écran (sous la barre du haut). */
  detents?: Record<Exclude<Detent, 'peek'>, number>
  /** Hauteur du cran `peek` mesurée (poignée, résumé, pied) : l'écran réserve cette place sous son contenu. */
  onPeekHeight?: (height: number) => void
  /** Figée au `peek`, sans poignée : rien à déplier (Signalements traités). */
  locked?: boolean
  detent: Detent
  onDetentChange: (detent: Detent) => void
  /** Nom accessible de la feuille. */
  label: string
  /** Toujours visible, sous la poignée : résumé lisible au cran `peek`. */
  header?: ReactNode
  /** Actions épinglées en bas, quel que soit le cran. */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

const DEFAULT_DETENTS: Record<Exclude<Detent, 'peek'>, number> = { half: 0.58, full: 0.94 }
const ORDER: readonly Detent[] = ['peek', 'half', 'full']

/**
 * Feuille persistante à crans, comme dans Plans : posée sur le contenu, jamais modale, on la tire par la
 * poignée (ou on la touche) entre `peek`, `half` et `full`. Le cran `peek` montre exactement la poignée, le
 * résumé (`header`) et le pied : sa hauteur suit le contenu, pas l'écran. Le contenu défile à l'intérieur ; le pied reste
 * épinglé. Au relâcher, elle se cale sur le cran le plus proche, ou sur le suivant après un geste de 24 px.
 */
export function DetentSheet({ detents = DEFAULT_DETENTS, onPeekHeight, locked = false, detent, onDetentChange, label, header, footer, children, className }: DetentSheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [parent, setParent] = useState(0)
  const handle = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const [peek, setPeek] = useState(0)
  const [drag, setDrag] = useState<{ startY: number; startHeight: number; height: number }>()
  useLayoutEffect(() => {
    const element = ref.current?.parentElement
    if (!element) return
    const measure = () => {
      setParent(element.clientHeight)
      setPeek((handle.current?.offsetHeight ?? 0) + (foot.current?.offsetHeight ?? 0))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    if (handle.current) observer.observe(handle.current)
    if (foot.current) observer.observe(foot.current)
    measure()
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => onPeekHeight?.(peek), [peek, onPeekHeight])
  const heightOf = (value: Detent) => (value === 'peek' ? peek : Math.max(peek, Math.round(parent * detents[value])))
  const height = drag?.height ?? heightOf(locked ? 'peek' : detent)
  const index = ORDER.indexOf(detent)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ startY: event.clientY, startHeight: heightOf(detent), height: heightOf(detent) })
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const next = Math.min(heightOf('full'), Math.max(heightOf('peek') * 0.8, drag.startHeight + drag.startY - event.clientY))
    setDrag({ ...drag, height: next })
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const moved = drag.startY - event.clientY
    setDrag(undefined)
    // Un toucher sans geste fait monter d'un cran, puis revient au peek depuis le haut.
    if (Math.abs(moved) < 4) return onDetentChange(ORDER[index === ORDER.length - 1 ? 0 : index + 1]!)
    if (Math.abs(moved) >= 24) {
      const target = Math.min(ORDER.length - 1, Math.max(0, index + (moved > 0 ? 1 : -1)))
      const nearest = ORDER.reduce((best, value) => (Math.abs(heightOf(value) - drag.height) < Math.abs(heightOf(best) - drag.height) ? value : best), ORDER[target]!)
      return onDetentChange(ORDER.indexOf(nearest) === index ? ORDER[target]! : nearest)
    }
    onDetentChange(detent)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp' && index < ORDER.length - 1) onDetentChange(ORDER[index + 1]!)
    else if (event.key === 'ArrowDown' && index > 0) onDetentChange(ORDER[index - 1]!)
    else return
    event.preventDefault()
  }

  return (
    <section
      ref={ref}
      aria-label={label}
      style={{ height }}
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-jo-xl bg-jo-surface shadow-[0_-8px_24px_rgb(0_0_0/0.18)] ring-1 ring-jo-border',
        !drag && 'transition-[height] duration-300 ease-out motion-reduce:transition-none',
        className,
      )}
    >
      {locked ? (
        <div ref={handle} className={cn('flex-none px-4 pt-4', footer ? 'pb-3' : 'pb-[calc(var(--jo-safe-bottom,0px)+16px)]')}>
          {header}
        </div>
      ) : (
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Hauteur de « ${label} »`}
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={index}
        aria-valuetext={detent === 'peek' ? 'Réduite' : detent === 'half' ? 'À moitié' : 'Plein écran'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(undefined)}
        onKeyDown={onKeyDown}
        ref={handle}
        className="jo-focus flex-none cursor-grab touch-none select-none px-4 pt-2 pb-3 active:cursor-grabbing"
      >
        <span aria-hidden className="mx-auto mb-3 block h-[5px] w-9 rounded-jo-full bg-jo-border" />
        {header}
      </div>
      )}
      <div className="jo-no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4" style={{ overflowY: detent === 'peek' && !drag ? 'hidden' : 'auto' }}>
        {children}
      </div>
      {footer && <div ref={foot} className="flex-none border-t border-jo-border bg-jo-surface px-4 pt-3 pb-[calc(var(--jo-safe-bottom,0px)+12px)]">{footer}</div>}
    </section>
  )
}
