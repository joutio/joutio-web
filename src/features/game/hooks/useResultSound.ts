import { useEffect, useRef } from "react"
import {
  playResultChime,
  stopChimes,
  type DuelResultOutcome,
} from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible — **dès
 * l'ouverture** de la page (il l'accompagne). Quitter la page avant la fin annule le son. Une
 * partie sans issue sportive (`null` : annulée) reste muette.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const played = useRef(false)
  // Quitter l'écran (navigation) coupe net les notes déjà planifiées : ceinture en plus du
  // changement de route (`useStopSoundsOnNavigate`).
  useEffect(() => stopChimes, [])

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    const timer = setTimeout(() => {
      played.current = true
      playResultChime(outcome)
    }, 0)
    return () => clearTimeout(timer)
  }, [enabled, outcome])
}
