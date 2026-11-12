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
  onChange: (value: T) => void
  /** Chaque page occupe au moins la hauteur du parent, pour y centrer un état vide. */
  fill?: boolean
  /** Prend la hauteur imposée par le parent : les pages s'y ajustent, sans défilement vertical. */
  contained?: boolean
  className?: string
}

/** Contenu d'onglets à balayer : suit l'onglet choisi, et le met à jour au balayage. */
export function TabsScrollView<T extends string>({ pages, value, onChange, fill = false, contained = false, className }: TabsScrollViewProps<T>) {
  const scroller = useRef<HTMLDivElement>(null)
  /** Page visée par un scroll programmé : les pages traversées ne changent pas l'onglet. */
  const target = useRef<number | null>(null)
  const mounted = useRef(false)
  const resetScroll = useParallaxScrollReset()
  const index = Math.max(0, pages.findIndex((page) => page.value === value))

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const left = index * element.clientWidth
    if (Math.abs(element.scrollLeft - left) < 2) return
    const instant = !mounted.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.current = instant ? null : index
    element.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' })
  }, [index])

  useEffect(() => {
    mounted.current = true
  }, [])

  // La hauteur suit la page affichée : une page courte ne garde pas celle de la plus longue.
  useLayoutEffect(() => {
    if (mounted.current) resetScroll?.()
  }, [index, resetScroll])

  useLayoutEffect(() => {
    const element = scroller.current
    const page = element?.children[index]
    if (contained || !element || !(page instanceof HTMLElement)) return
    // offsetHeight, pas getBoundingClientRect : cette dernière suit les transform des parents.
    const parent = element.parentElement
    const update = () => {
      // Sans hauteur, la page reprend sa taille naturelle : une page longue ne reste pas la référence.
      if (fill) element.style.height = ''
      const height = fill && parent ? Math.max(page.offsetHeight, parent.clientHeight) : page.offsetHeight
      element.style.height = `${height}px`
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(page)
    if (fill && parent) observer.observe(parent)
    return () => observer.disconnect()
  }, [index, fill, contained])

  const onScroll = () => {
    const element = scroller.current
    if (!element) return
    const current = Math.round(element.scrollLeft / element.clientWidth)
    if (target.current !== null) {
      if (current === target.current && Math.abs(element.scrollLeft - current * element.clientWidth) < 2) target.current = null
      return
    }
    const page = pages[current]
    if (page && page.value !== value) onChange(page.value)
  }

  // `contain` : les pages prennent la largeur donnée, jamais celle de leur contenu.
  // `overflow-y-hidden` : `overflow-x: auto` rendrait l'axe vertical défilable ; les pages plus longues que la page
  // affichée y débordent, et la molette les faisait défiler une fois l'écran en bas (Profil).
  return (
    <div ref={scroller} onScroll={onScroll} className={cn('jo-no-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden [contain:inline-size]', contained ? 'items-stretch' : 'items-start', className)}>
      {pages.map((page, pageIndex) => (
        <section key={page.value} aria-hidden={pageIndex !== index} className={cn('w-full flex-none snap-start snap-always', fill && 'grid min-h-full', contained && 'min-h-0')}>
          {page.content}
        </section>
      ))}
    </div>
  )
}
