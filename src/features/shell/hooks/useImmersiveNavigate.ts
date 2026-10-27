import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import type { NavigateOptions } from "react-router-dom"
import { useIsImmersiveRoute } from "./useIsImmersiveRoute"

/**
 * Navigation des écrans d'immersion : depuis une route immersive, toute entrée dans l'immersion
 * **remplace** l'entrée courante (la pile reste bornée à `[écran d'origine, immersion]`, même
 * après plusieurs revanches) ; depuis un écran normal, la navigation est un `push` classique
 * (la sortie revient naturellement à l'écran d'origine). `viewTransition` est activé quand le
 * navigateur le supporte (fallback silencieux).
 */
export function useImmersiveNavigate() {
  const navigate = useNavigate()
  const inImmersion = useIsImmersiveRoute()

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      void navigate(
        to,
        inImmersion
          ? { ...options, replace: true, viewTransition: true }
          : { viewTransition: true, ...options }
      )
    },
    [navigate, inImmersion]
  )
}
