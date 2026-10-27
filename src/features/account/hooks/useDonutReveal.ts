import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { DONUT_REVEAL_MS } from "../domain/topics-played-chart"

/** Part du reveal réservée au fondu d'apparition des libellés et de leurs leaders. */
const LABEL_FADE = 0.3
/** Fenêtre d'apparition des compteurs : l'arc doit couvrir son milieu avant qu'ils se posent. */
const COUNT_FADE_START = 0.45
const COUNT_FADE_END = 0.75

interface DonutReveal {
  /** Dessin des arcs (0 → 1), en progression linéaire. */
  progress: number
  /** Opacité des libellés et leaders (fondu court en tête de reveal). */
  labelOpacity: number
  /** Opacité des compteurs (apparaissent quand les arcs couvrent leur milieu de part). */
  countOpacity: number
}

/**
 * Reveal du donut « Sujets joués » **à l'ouverture de l'onglet** : arcs, compteurs et libellés
 * montent sur une même horloge `requestAnimationFrame` (`DONUT_REVEAL_MS`, progression
 * linéaire — même rythme que l'anneau de résultat), **une fois par affichage** (le panneau
 * d'onglet est remonté à chaque ouverture). `prefers-reduced-motion` (via `useReducedMotion`,
 * comme `useRingReveal`) pose l'état final immédiatement — le garde-fou CSS global ne couvre
 * pas une animation pilotée en JS.
 */
export function useDonutReveal(): DonutReveal {
  const reduced = useReducedMotion() ?? false
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (reduced) return
    let start: number | null = null
    let frame = 0
    const tick = (now: number) => {
      if (start == null) start = now
      const raw = Math.min(1, (now - start) / DONUT_REVEAL_MS)
      setProgress(raw)
      if (raw < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  const eased = reduced ? 1 : progress

  return {
    progress: eased,
    labelOpacity: Math.min(1, eased / LABEL_FADE),
    countOpacity: Math.max(
      0,
      Math.min(
        1,
        (eased - COUNT_FADE_START) / (COUNT_FADE_END - COUNT_FADE_START)
      )
    ),
  }
}
