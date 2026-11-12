import { useLayoutEffect, useRef, type ReactNode } from 'react'
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
  /** Conservé pour l'API du lab : sur le web, seul l'onglet change la page. */
  onChange: (value: T) => void
  /** Chaque page occupe au moins la hauteur du parent, pour y centrer un état vide. */
  fill?: boolean
  /** Prend la hauteur imposée par le parent : les pages s'y ajustent, sans défilement vertical. */
  contained?: boolean
  className?: string
}

/**
 * Contenu d'onglets. Le balayage horizontal entre pages est propre à l'app mobile (`joutio-mobile`) : sur le web
 * (décision du 2026-11-12), seule la page de l'onglet choisi est affichée, les autres restent montées mais masquées
 * (données et défilement conservés d'un onglet à l'autre).
 */
export function TabsScrollView<T extends string>({ pages, value, fill = false, contained = false, className }: TabsScrollViewProps<T>) {
  const mounted = useRef(false)
  const resetScroll = useParallaxScrollReset()
  const index = Math.max(0, pages.findIndex((page) => page.value === value))

  // Une page courte ne laisse pas l'écran défilé au-delà du bloc collé.
  useLayoutEffect(() => {
    if (mounted.current) resetScroll?.()
    mounted.current = true
  }, [index, resetScroll])

  return (
    <div className={cn('flex flex-col', fill && 'min-h-full', contained && 'min-h-0', className)}>
      {pages.map((page, pageIndex) => (
        <section
          key={page.value}
          hidden={pageIndex !== index}
          className={cn('w-full', pageIndex !== index ? 'hidden' : fill ? 'grid flex-1' : contained ? 'flex min-h-0 flex-1 flex-col' : 'block')}
        >
          {page.content}
        </section>
      ))}
    </div>
  )
}
