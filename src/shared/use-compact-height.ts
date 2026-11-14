import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Vrai quand l'élément est plus court que `threshold` (px), suivi au redimensionnement. Le résultat passe ainsi en
 * compact sur un écran court comme l'iPhone Duo plié (`resultat.md` § 4 bis, 2026-11-14).
 */
export function useCompactHeight<T extends HTMLElement = HTMLDivElement>(threshold: number) {
  const ref = useRef<T>(null)
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setCompact(element.clientHeight > 0 && element.clientHeight < threshold)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, compact] as const
}
