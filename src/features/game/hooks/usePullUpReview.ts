import { useRef, type TouchEvent } from "react"

/** Seuil (px) de glissement vertical vers le haut pour ouvrir la revue. */
const PULL_UP_THRESHOLD = 48

interface UsePullUpReviewOptions {
  /**
   * Le geste n'ouvre la revue que si elle est disponible : questions à revoir et pas de
   * carousel de revue déjà affiché (desktop).
   */
  enabled: boolean
  onPull: () => void
}

/**
 * Glissement vers le haut (tactile) sur l'écran de résultat → ouvre la revue des questions.
 * Le geste doit être majoritairement vertical (un swipe horizontal de carousel ne compte pas).
 */
export function usePullUpReview({ enabled, onPull }: UsePullUpReviewOptions) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    start.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  const onTouchEnd = (event: TouchEvent) => {
    const from = start.current
    start.current = null
    const touch = event.changedTouches[0]
    if (!from || !touch) return
    const dy = touch.clientY - from.y
    const dx = touch.clientX - from.x
    if (enabled && dy <= -PULL_UP_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onPull()
    }
  }

  return { onTouchStart, onTouchEnd }
}
