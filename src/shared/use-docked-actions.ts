import { useEffect, useRef, useState } from 'react'

/** Hauteur de la barre compacte de `ParallaxScreen`. */
const COMPACT_BAR = 52

/** Indique quand les actions de la page passent sous la barre compacte : leurs icônes y prennent le relais. */
export function useDockedActions(enabled = true) {
  const actions = useRef<HTMLDivElement>(null)
  const [docked, setDocked] = useState(false)

  useEffect(() => {
    const element = actions.current
    if (!enabled || !element) {
      setDocked(false)
      return
    }
    const safeTop = Number.parseFloat(getComputedStyle(element).getPropertyValue('--jo-safe-top')) || 0
    const observer = new IntersectionObserver(([entry]) => setDocked(entry?.isIntersecting === false), { root: element.closest('main'), rootMargin: `-${safeTop + COMPACT_BAR}px 0px 0px 0px` })
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return { actions, docked }
}
