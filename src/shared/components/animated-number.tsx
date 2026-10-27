import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  /** Durée du comptage (ms), alignée sur les transitions de l'arène (jauges, scores). */
  duration?: number
}

/**
 * Compteur « horloge numérique » : monte de sa valeur courante à la valeur cible sur `duration`,
 * en **progression linéaire** — même rythme que la transition CSS des jauges latérales
 * (`height <durée> linear`, durée partagée via `SCORE_REVEAL_MS`). Piloté par
 * `requestAnimationFrame`, il reste solidaire de la jauge. Une nouvelle cible en cours
 * d'animation repart de la valeur affichée.
 */
export function AnimatedNumber({ value, duration = 550 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const shown = useRef(value)

  useEffect(() => {
    const from = shown.current
    if (from === value) return
    let frame = 0
    let startedAt: number | null = null

    const tick = (now: number) => {
      if (startedAt == null) startedAt = now
      const progress =
        duration > 0 ? Math.min(1, (now - startedAt) / duration) : 1
      const next = Math.round(from + (value - from) * progress)
      if (next !== shown.current) {
        shown.current = next
        setDisplay(next)
      }
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{display}</>
}
