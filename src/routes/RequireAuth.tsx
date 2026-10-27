import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { rememberReturnTo, useSession } from "@/features/auth"

/** Redirige vers /login si aucune session OIDC n'est active. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated } = useSession()
  const location = useLocation()

  if (!authenticated) {
    // Conserve la cible (ex. lien de salon `/join/:code`) pour la restaurer après login.
    const from = `${location.pathname}${location.search}`
    rememberReturnTo(from)
    return <Navigate to="/login" state={{ from }} replace />
  }
  return children
}
