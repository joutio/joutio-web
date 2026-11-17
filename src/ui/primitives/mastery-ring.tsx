import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { cn } from '../lib/cn'
import { useT } from '@/lib/i18n'

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

/** Débord toléré des libellés rayonnants dans la gouttière de la page (16 px) : jamais jusqu'au bord de l'écran. */
const GUTTER = 8
/** Diamètre minimal de l'anneau rayonnant (celui de l'anneau compact) : en dessous, les libellés s'empilent à sa droite. */
const RING_MIN = 104
/** Point (7) et écart (8) entre le trait et le libellé. */
const LABEL_CHROME = 15

/**
 * Diamètre de l'anneau rayonnant qui garde ses libellés **mesurés** dans la largeur (2026-11-15). Il remplace une portée
 * fixe de 100 px, qui empilait les libellés sur les écrans de 360 à 380 px. Calcul au pire cas : un libellé à
 * l'horizontale (r + trait de 0,28 r + point, écart et texte). Ainsi l'anneau ne change pas de taille pendant
 * l'animation ni à l'arrivée de la récompense. Il rétrécit jusqu'à `RING_MIN` ; en dessous, la fonction renvoie
 * `undefined` et le composant passe à la rangée empilée.
 */
export function fitRing(requested: number, width: number, labels: { left: number; right: number }) {
  const room = width / 2 + GUTTER - LABEL_CHROME - Math.max(labels.left, labels.right)
  const size = Math.min(requested, Math.floor((2 * room) / 1.28))
  return size >= Math.min(requested, RING_MIN) ? size : undefined
}

/**
 * Largeur de mise en page des éléments (`offsetWidth`, insensible à la réduction du cadre web), suivie au
 * redimensionnement et au chargement des polices ; 0 avant la première mesure.
 */
function useWidths(refs: readonly RefObject<HTMLElement | null>[]) {
  const [widths, setWidths] = useState<number[]>(() => refs.map(() => 0))
  useLayoutEffect(() => {
    const elements = refs.map((ref) => ref.current)
    const update = () =>
      setWidths((current) => {
        const next = elements.map((element) => element?.offsetWidth ?? 0)
        return next.every((value, index) => value === current[index]) ? current : next
      })
    update()
    const observer = new ResizeObserver(update)
    elements.forEach((element) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [refs])
  return widths
}

/**
 * Maîtrise du sujet après la partie : XP gagnée (arc ambre) et XP restante avant le palier suivant. Libellés de part et
 * d'autre de l'anneau, qui rétrécit pour les garder (`fitRing`) ; trop étroit même ainsi, ils s'empilent à sa droite,
 * anneau à sa taille demandée.
 */
export function MasteryRing({ tier, next, gained, remaining, size: requested = 180, state = 'done', compact = false, className }: MasteryRingProps) {
  const t = useT()
  const pending = state === 'pending'
  const root = useRef<HTMLDivElement>(null)
  const probeLeft = useRef<HTMLDivElement>(null)
  const probeRight = useRef<HTMLDivElement>(null)
  const [refs] = useState(() => [root, probeLeft, probeRight] as const)
  const [width = 0, left = 0, right = 0] = useWidths(refs)
  const measured = width > 0 && left > 0 && right > 0
  const fitted = measured ? fitRing(requested, width, { left, right }) : requested
  const narrow = fitted === undefined
  const size = compact || narrow ? requested : fitted
  const progress = useCountUp(`${gained}/${remaining}`, pending)

  const total = gained + remaining
  const shownGained = Math.round(gained * progress)
  const percent = pending ? 0 : (total > 0 ? (gained / total) * 100 : 100) * progress
  const rad = Math.PI / 180
  const gainedAngle = Math.max(36, 1.8 * percent) * rad
  const remainingAngle = Math.max(216, 180 + 1.8 * percent) * rad
  const line = Math.round(size * 0.14)
  const opacity = pending ? 0 : Math.min(1, progress / 0.25)
  const label = pending
    ? t('ds.masteryPendingA11y', { tier })
    : t('ds.masteryA11y', { tier, gained, rest: next ? t('ds.remainingBefore', { remaining, next }) : t('ds.maxTierLower') })
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
        <span className="jo-type-caption font-semibold text-jo-muted">{t('topic.mastery')}</span>
        <strong className={compact ? 'jo-type-headline font-bold' : 'jo-type-title-2 font-bold'}>{tier}</strong>
      </div>
    </div>
  )

  const stacked = (
    <>
      {ring}
      <div className="grid gap-2" style={{ opacity }}>
          <div className="text-jo-accent-ink">
            <div className="jo-type-caption font-semibold whitespace-nowrap">{t('ds.xpGained')}</div>
            <div className="jo-type-title-2 font-mono font-semibold">+{shownGained}</div>
          </div>
          <div>
            <div className="jo-type-caption font-semibold whitespace-nowrap">{next ? t('ds.before', { next }) : t('ds.maxTier')}</div>
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

  // Anneau réduit pour ses libellés : centré dans la hauteur demandée, le reste de la page ne bouge pas.
  const inset = (requested - size) / 2

  // Racine unique (mesurée) pour les deux dispositions ; invisible jusqu'à la mesure, pour ne pas afficher l'anneau à
  // une taille qu'il quitterait aussitôt.
  return (
    <div ref={root} role="img" aria-label={label} className={cn('relative w-full', className)} style={{ height: requested, opacity: measured ? 1 : 0 }}>
      {/* Libellés rayonnants à leur valeur finale, invisibles : leur largeur règle l'anneau (`fitRing`). */}
      <div aria-hidden className="pointer-events-none invisible absolute top-0 left-0">
        <div ref={probeLeft} className="absolute w-max text-right">
          <div className="jo-type-caption font-semibold whitespace-nowrap">{next ? t('ds.before', { next }) : t('ds.maxTier')}</div>
          <div className="jo-type-large-title font-mono font-semibold">{total}</div>
        </div>
        <div ref={probeRight} className="absolute w-max">
          <div className="jo-type-caption font-semibold whitespace-nowrap">{t('ds.xpGained')}</div>
          <div className="jo-type-large-title font-mono font-semibold">+{gained}</div>
        </div>
      </div>
      {narrow ? (
        // Trop étroit pour les libellés rayonnants, même anneau réduit : même rangée, centrée.
        <div className="flex h-full items-center justify-center gap-4">{stacked}</div>
      ) : (
        <div className="relative flex h-full justify-center" style={{ paddingTop: inset }}>
          <div
            className="absolute flex -translate-y-1/2 items-center"
            style={{ right: `calc(50% + ${(size * -0.5 * Math.sin(remainingAngle)).toFixed(1)}px)`, top: inset + (1 - Math.cos(remainingAngle)) * size * 0.5, opacity }}
          >
            <div className="mr-2 text-right">
              <div className="jo-type-caption font-semibold whitespace-nowrap">{next ? t('ds.before', { next }) : t('ds.maxTier')}</div>
              <div className="jo-type-large-title font-mono font-semibold">{total - shownGained}</div>
            </div>
            <span className="size-[7px] rounded-jo-full bg-jo-text" />
            <span className="h-0.5 bg-jo-text" style={{ width: line }} />
          </div>
          {ring}
          <div
            className="absolute flex -translate-y-1/2 items-center"
            style={{ left: `calc(50% + ${(size * 0.5 * Math.sin(gainedAngle)).toFixed(1)}px)`, top: inset + (1 - Math.cos(gainedAngle)) * size * 0.5, opacity }}
          >
            <span className="h-0.5 bg-jo-accent" style={{ width: line }} />
            <span className="size-[7px] rounded-jo-full bg-jo-accent" />
            <div className="ml-2 text-jo-accent-ink">
              <div className="jo-type-caption font-semibold whitespace-nowrap">{t('ds.xpGained')}</div>
              <div className="jo-type-large-title font-mono font-semibold">+{shownGained}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
