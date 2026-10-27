import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { RING_REVEAL_MS } from "../domain/game-constants"

/** Part du reveal réservée au fondu d'apparition des valeurs des callouts. */
const VALUE_FADE = 0.25

interface RingReveal {
  /** Remplissage animé du segment corail (0 → cible, en %). */
  percent: number
  /** « XP gagnée » comptée de 0 jusqu'à la cible. */
  gained: number
  /** Opacité des valeurs (0 → 1) : fondu court en tête de reveal. */
  valueOpacity: number
}

/**
 * Reveal de l'anneau de maîtrise : dès que la récompense est projetée, le remplissage et le
 * compteur montent de 0 à leur cible (`RING_REVEAL_MS`, **progression linéaire** — même rythme
 * que les jauges du duel), **une fois par affichage**. Le hook pilote les deux d'une même horloge `requestAnimationFrame` pour que
 * l'arc, les tracés pointés et la valeur « XP gagnée » restent solidaires ; la salve d'XP
 * s'étale sur cette durée (`features/game/domain/accumulation.ts`).
 * `prefers-reduced-motion` (via `useReducedMotion`, comme `useResultSound`) pose l'état final
 * dès que `enabled` passe à vrai — le garde-fou CSS global ne couvre pas une animation pilotée
 * en JS.
 */
export function useRingReveal(
  targetPercent: number,
  targetGained: number,
  enabled: boolean
): RingReveal {
  const reduced = useReducedMotion() ?? false
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled || reduced) return
    let start: number | null = null
    let frame = 0
    const tick = (now: number) => {
      if (start == null) start = now
      const raw = Math.min(1, (now - start) / RING_REVEAL_MS)
      setProgress(raw)
      if (raw < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, reduced])

  const eased = reduced && enabled ? 1 : progress

  return {
    percent: targetPercent * eased,
    gained: Math.round(targetGained * eased),
    valueOpacity: Math.min(1, eased / VALUE_FADE),
  }
}
