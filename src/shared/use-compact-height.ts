import { useCallback, useLayoutEffect, useState } from 'react'

/**
 * Vrai quand l'élément est plus court que `threshold` (px), suivi au redimensionnement. Le résultat passe ainsi en
 * compact sur un écran court comme l'iPhone Duo plié (`resultat.md` § 4 bis, 2026-11-14).
 *
 * Ref callback : l'élément peut apparaître après le premier rendu (Résultat derrière la séquence de déblocages) ; la
 * mesure démarre dès qu'il est monté, pas seulement au montage du composant (2026-11-20).
 */
export function useCompactHeight<T extends HTMLElement = HTMLDivElement>(threshold: number) {
  const [element, setElement] = useState<T | null>(null)
  const [compact, setCompact] = useState(false)
  const ref = useCallback((node: T | null) => setElement(node), [])
  useLayoutEffect(() => {
    if (!element) return
    const update = () => setCompact(element.clientHeight > 0 && element.clientHeight < threshold)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, threshold])
  return [ref, compact] as const
}
