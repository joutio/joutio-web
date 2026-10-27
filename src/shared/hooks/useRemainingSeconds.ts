import { useEffect, useState } from "react"

/** Secondes restantes (arrondi supérieur) avant une échéance ISO, 0 sans échéance. */
export function remainingSeconds(
  deadlineAt: string | null | undefined,
  now: number
): number {
  if (!deadlineAt) return 0
  const deadline = Date.parse(deadlineAt)
  if (!Number.isFinite(deadline)) return 0
  return Math.max(0, Math.ceil((deadline - now) / 1_000))
}

/**
 * Compte à rebours en secondes, rafraîchi quatre fois par seconde pour rester aligné sur les
 * frontières d'affichage. La valeur est recalculée à chaque rendu (donc immédiatement quand
 * l'échéance change), le timer ne servant qu'à forcer le rafraîchissement.
 *
 * <p>`clock` doit être l'horloge serveur quand l'échéance vient du backend.</p>
 */
export function useRemainingSeconds(
  deadlineAt: string | null | undefined,
  clock: () => number
): number {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!deadlineAt) return
    const timer = window.setInterval(() => setTick((value) => value + 1), 250)
    return () => window.clearInterval(timer)
  }, [deadlineAt])

  return remainingSeconds(deadlineAt, clock())
}
