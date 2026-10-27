import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Retour natif (historique navigateur) avec repli explicite quand il n'y a pas d'historique
 * (arrivée directe par lien) — évite les redirections artificielles vers une page fixe.
 * Le repli (idx 0) profite de la transition de vue ; le POP natif n'accepte pas d'options
 * dans React Router et reste instantané.
 */
export function useGoBack(fallback = "/") {
  const navigate = useNavigate()

  return useCallback(() => {
    const state = window.history.state as { idx?: number } | null
    if ((state?.idx ?? 0) > 0) {
      void navigate(-1)
    } else {
      void navigate(fallback, { viewTransition: true })
    }
  }, [navigate, fallback])
}
