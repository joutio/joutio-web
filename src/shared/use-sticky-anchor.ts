import { useCallback, useRef } from 'react'

/** Défilement d'un écran à `StickyBar` : l'ancre se pose juste au-dessus de la barre. */
export function useStickyAnchor() {
  const anchor = useRef<HTMLDivElement>(null)

  /** Ramène au seuil de collage : le nouveau contenu commence sous la barre. Sans effet avant ce seuil. */
  const toThreshold = useCallback(() => {
    const element = anchor.current
    const scroller = element?.closest('main')
    if (!element || !scroller) return
    const threshold = element.offsetTop - scroller.offsetTop
    if (scroller.scrollTop > threshold) scroller.scrollTop = threshold
  }, [])

  const toTop = useCallback(() => {
    anchor.current?.closest('main')?.scrollTo({ top: 0 })
  }, [])

  return { anchor, toThreshold, toTop }
}
