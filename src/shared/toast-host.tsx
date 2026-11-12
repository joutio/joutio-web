import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Toast } from '@/ui'
import { TOAST_DURATION_MS, TOAST_VISIBLE, useToastStore, type ToastEntry } from './toast'

/** Pile repliée : chaque toast plus ancien dépasse de 10 px sous le précédent et rétrécit de 5 %. */
const PEEK = 10
const SCALE_STEP = 0.05
/** Pile dépliée : écart entre deux toasts. */
const GAP = 8
/** La pile dépliée se replie seule après 4 s sans geste. */
const COLLAPSE_MS = 4000
const FALLBACK_HEIGHT = 64

/**
 * Toasts globaux (`toast.md`), placés comme dans le lab : en haut de l'écran, en haut à droite au-delà de 640 px. Pile
 * de 3 au plus ; toucher la pile repliée la déplie, chaque toast devient alors touchable.
 */
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts)
  const expanded = useToastStore((state) => state.expanded)
  const setExpanded = useToastStore((state) => state.setExpanded)
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [activity, setActivity] = useState(0)

  const active = toasts.filter((entry) => !entry.leaving).length
  const stacked = !expanded && active > 1

  useEffect(() => {
    if (!expanded) return
    const timer = window.setTimeout(() => setExpanded(false), COLLAPSE_MS)
    return () => window.clearTimeout(timer)
  }, [expanded, activity, setExpanded])

  // Position de chaque toast parmi les toasts actifs ; un toast qui sort garde la place qu'il occupait.
  // `top` cumule les hauteurs mesurées pour la pile dépliée.
  const heightOf = (entry: ToastEntry) => heights[entry.id] ?? FALLBACK_HEIGHT
  const slots: { entry: ToastEntry; index: number; top: number }[] = []
  for (const entry of toasts) {
    const previous = slots.findLast((slot) => !slot.entry.leaving)
    const index = previous ? previous.index + 1 : 0
    const top = previous ? previous.top + heightOf(previous.entry) + GAP : 0
    slots.push({ entry, index, top })
  }
  const visible = slots.filter((slot) => slot.index < TOAST_VISIBLE)
  const shown = visible.filter((slot) => !slot.entry.leaving)
  // Zone touchable : la pile dépliée entière, ou le toast de devant et les bords qui dépassent.
  const height = expanded
    ? shown.reduce((sum, slot) => sum + heightOf(slot.entry) + GAP, 0) - GAP
    : shown[0]
      ? heightOf(shown[0].entry) + (shown.length - 1) * PEEK
      : 0

  if (toasts.length === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      onPointerMove={expanded ? () => setActivity((count) => count + 1) : undefined}
      style={{ height: Math.max(height, 0) }}
      className="pointer-events-none absolute inset-x-4 top-[calc(var(--jo-safe-top,0px)+8px)] z-50 @min-[640px]/app:inset-x-auto @min-[640px]/app:top-20 @min-[640px]/app:right-6 @min-[640px]/app:w-[360px]"
    >
      {visible.map(({ entry, index, top }) => (
        <ToastSlot
          key={entry.id}
          entry={entry}
          index={index}
          top={top}
          expanded={expanded}
          stacked={stacked}
          onExpand={() => setExpanded(true)}
          onMeasure={(value) => setHeights((current) => (current[entry.id] === value ? current : { ...current, [entry.id]: value }))}
        />
      ))}
    </div>
  )
}

function ToastSlot({
  entry,
  index,
  top,
  expanded,
  stacked,
  onExpand,
  onMeasure,
}: {
  entry: ToastEntry
  index: number
  top: number
  expanded: boolean
  stacked: boolean
  onExpand: () => void
  onMeasure: (height: number) => void
}) {
  const dismiss = useToastStore((state) => state.dismiss)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight
    if (height) onMeasure(height)
  })

  // 4 s, relancées à chaque mise à jour ; suspendues tant que la pile est dépliée.
  const duration = entry.duration ?? TOAST_DURATION_MS
  useEffect(() => {
    if (expanded || entry.leaving || !Number.isFinite(duration)) return
    const timer = window.setTimeout(() => dismiss(entry.id), duration)
    return () => window.clearTimeout(timer)
  }, [entry.id, entry.version, entry.leaving, expanded, duration, dismiss])

  // Pile repliée : le premier toucher déplie au lieu d'ouvrir le toast.
  const onClickCapture = (event: MouseEvent) => {
    if (!stacked) return
    event.preventDefault()
    event.stopPropagation()
    onExpand()
  }
  const transform = expanded ? `translateY(${top}px)` : `translateY(${index * PEEK}px) scale(${1 - index * SCALE_STEP})`
  return (
    <div
      className="jo-toast-slot pointer-events-auto absolute inset-x-0 top-0"
      style={{ transform, zIndex: TOAST_VISIBLE - index, opacity: entry.leaving ? undefined : 1 }}
      onClickCapture={onClickCapture}
      // Après l'action éventuelle du toast (qui reçoit le clic en premier), il se ferme.
      onClick={() => dismiss(entry.id)}
      aria-hidden={!expanded && index > 0 ? true : undefined}
    >
      <div ref={ref} className={entry.leaving ? 'jo-toast-out' : 'jo-toast-in'}>
        {/* Mise à jour en place : le nouveau contenu arrive en fondu (300 ms). */}
        <div key={entry.version} style={entry.version > 1 ? { animation: 'jo-fade-in 300ms ease both' } : undefined}>
          {entry.content ?? <Toast tone={entry.tone} title={entry.title ?? ''} description={entry.description} onClick={entry.onClick} />}
        </div>
      </div>
    </div>
  )
}
