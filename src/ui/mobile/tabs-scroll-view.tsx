import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useParallaxScrollReset } from './parallax-screen'

export type TabsScrollPage<T extends string> = {
  value: T
  content: ReactNode
}

export type TabsScrollViewProps<T extends string> = {
  pages: readonly TabsScrollPage<T>[]
  /** Onglet affiché, partagé avec `Segmented`. */
  value: T
  /** Page atteinte au balayage (pages `contained`) ; les onglets la changent eux-mêmes. */
  onChange: (value: T) => void
  /** Chaque page occupe au moins la hauteur du parent, pour y centrer un état vide. */
  fill?: boolean
  /** Prend la hauteur imposée par le parent : les pages s'y ajustent, sans défilement vertical. */
  contained?: boolean
  className?: string
}

/**
 * Contenu d'onglets. Deux usages, comme dans le lab :
 * - **onglets** (Profil, Fiche sujet…) : sur le web (décision du 2026-11-12), pas de balayage, seule la page de l'onglet
 *   choisi est affichée, les autres restent montées mais masquées (données et défilement conservés) ;
 * - **pages à balayer** (`contained` : Détails du duel, Signalements d'une question) : défilement horizontal natif
 *   aimanté, porté tel quel du lab (2026-11-12, rendu identique demandé) — il suit la page choisie et la met à jour au
 *   balayage.
 */
export function TabsScrollView<T extends string>(props: TabsScrollViewProps<T>) {
  return props.contained ? <SwipePages {...props} /> : <TabPages {...props} />
}

function TabPages<T extends string>({ pages, value, fill = false, className }: TabsScrollViewProps<T>) {
  const mounted = useRef(false)
  const resetScroll = useParallaxScrollReset()
  const index = Math.max(0, pages.findIndex((page) => page.value === value))

  // Une page courte ne laisse pas l'écran défilé au-delà du bloc collé.
  useLayoutEffect(() => {
    if (mounted.current) resetScroll?.()
    mounted.current = true
  }, [index, resetScroll])

  return (
    <div className={cn('flex flex-col', fill && 'min-h-full', className)}>
      {pages.map((page, pageIndex) => (
        <section key={page.value} hidden={pageIndex !== index} className={cn('w-full', pageIndex !== index ? 'hidden' : fill ? 'grid flex-1' : 'block')}>
          {page.content}
        </section>
      ))}
    </div>
  )
}

/** Pages à balayer du lab (`design/src/design-system/mobile/tabs-scroll-view.tsx`, branche `contained`). */
function SwipePages<T extends string>({ pages, value, onChange, className }: TabsScrollViewProps<T>) {
  const scroller = useRef<HTMLDivElement>(null)
  /** Page visée par un scroll programmé : les pages traversées ne changent pas l'onglet. */
  const target = useRef<number | null>(null)
  /**
   * Page signalée par le balayage lui-même : l'écran la renvoie en `value`, mais le défilement y est déjà (ou l'aimant
   * natif l'y amène). Relancer un `scrollTo` animé pendant que le doigt ou l'inertie travaillent les faisait se battre :
   * saccades au toucher sur téléphone (2026-11-13), invisibles à la molette sur ordinateur.
   */
  const swiped = useRef<number | null>(null)
  const mounted = useRef(false)
  const resetScroll = useParallaxScrollReset()
  const index = Math.max(0, pages.findIndex((page) => page.value === value))

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    if (swiped.current === index) {
      swiped.current = null
      return
    }
    swiped.current = null
    const left = index * element.clientWidth
    if (Math.abs(element.scrollLeft - left) < 2) return
    const instant = !mounted.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.current = instant ? null : index
    element.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' })
  }, [index])

  useEffect(() => {
    mounted.current = true
  }, [])

  useLayoutEffect(() => {
    if (mounted.current) resetScroll?.()
  }, [index, resetScroll])

  const onScroll = () => {
    const element = scroller.current
    if (!element) return
    const current = Math.round(element.scrollLeft / element.clientWidth)
    if (target.current !== null) {
      if (current === target.current && Math.abs(element.scrollLeft - current * element.clientWidth) < 2) target.current = null
      return
    }
    const page = pages[current]
    if (page && page.value !== value) {
      swiped.current = current
      onChange(page.value)
    }
  }

  // `contain` : les pages prennent la largeur donnée, jamais celle de leur contenu. `overflow-y-hidden` : l'axe
  // vertical ne défile pas.
  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className={cn('jo-no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto overflow-y-hidden overscroll-x-contain [contain:inline-size] [-webkit-overflow-scrolling:touch]', className)}
    >
      {pages.map((page, pageIndex) => (
        <section key={page.value} aria-hidden={pageIndex !== index} className="min-h-0 w-full flex-none snap-start snap-always">
          {page.content}
        </section>
      ))}
    </div>
  )
}
