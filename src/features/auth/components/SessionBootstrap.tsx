import { useEffect, type ReactNode } from "react"
import { initSession } from "../lib/oidc"

/**
 * Initialise la session OIDC au démarrage (restaure le user stocké, rafraîchit s'il est
 * expiré) et laisse le store piloter le statut. Remplace l'ancien `AuthProvider` : plus de
 * contexte React, la source de vérité est `useSessionStore`.
 */
export function SessionBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initSession()
  }, [])

  return children
}
