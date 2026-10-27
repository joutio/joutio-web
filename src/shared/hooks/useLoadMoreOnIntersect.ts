import { useEffect, useRef } from "react"
import type { RefObject } from "react"

interface UseLoadMoreOnIntersectOptions {
  /** Active l'observation (typiquement `hasNextPage && !isFetchingNextPage`). */
  enabled: boolean
  onLoadMore: () => void
  /** Conteneur de scroll racine de l'observer (viewer par défaut). */
  rootRef?: RefObject<Element | null> | null
}

/**
 * Déclenche `onLoadMore` quand la sentinelle rendue approche du viewport — scroll infini
 * « natif » sans bouton. `rootMargin` élevé pour précharger avant d'atteindre le bas.
 */
export function useLoadMoreOnIntersect({
  enabled,
  onLoadMore,
  rootRef,
}: UseLoadMoreOnIntersectOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !enabled || typeof IntersectionObserver === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current()
        }
      },
      { root: rootRef?.current ?? null, rootMargin: "600px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, rootRef])

  return sentinelRef
}
