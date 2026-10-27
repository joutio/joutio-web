import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { stopChimes } from "@/shared/audio"

/**
 * Coupe les sons à chaque changement de page : un motif long (jingle, salve d'accumulation,
 * tic-tac de countdown) ne doit jamais survivre à la navigation — on quitte l'écran qui l'a
 * déclenché, le son s'arrête net.
 */
export function useStopSoundsOnNavigate(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    stopChimes()
  }, [pathname])
}
