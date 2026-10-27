import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { playAccumulationChime, stopChimes } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import {
  REDUCED_MOTION_SALVE_MS,
  REDUCED_MOTION_TICKS,
  ringAccumulationTicks,
} from "../domain/accumulation"
import { RING_REVEAL_MS } from "../domain/game-constants"

/**
 * Salve d'accumulation de l'anneau de maîtrise (page résultat) : le **même motif** que celui de
 * l'arène, joué **une fois par affichage** dès que la récompense est projetée — c'est l'instant
 * où `useRingReveal` lance le remplissage de l'arc et le compteur d'XP. En
 * `prefers-reduced-motion`, l'anneau est posé d'un coup (aucune animation à accompagner) : motif
 * court unique. Muet tant que la récompense n'est pas là (partie annulée, `reward` en cours
 * d'attribution) ou si elle vaut 0 XP.
 */
export function useRingAccumulationSound(xpGained: number | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const reduced = useReducedMotion() ?? false
  const played = useRef(false)
  // Quitter l'écran (navigation) coupe net les notes déjà planifiées : ceinture en plus du
  // changement de route (`useStopSoundsOnNavigate`).
  useEffect(() => stopChimes, [])

  useEffect(() => {
    if (!enabled || played.current || xpGained == null || xpGained <= 0) return
    // Différé d'un tick : `useStopSoundsOnNavigate` coupe les sons au changement de route ;
    // l'effet parent s'exécute après les effets enfants et ne doit pas emporter la salve.
    const timer = window.setTimeout(() => {
      played.current = true
      playAccumulationChime(
        reduced ? REDUCED_MOTION_TICKS : ringAccumulationTicks(xpGained),
        reduced ? REDUCED_MOTION_SALVE_MS : RING_REVEAL_MS
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [enabled, xpGained, reduced])
}
