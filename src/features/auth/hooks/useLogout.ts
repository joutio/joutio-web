import { useNavigate } from "react-router-dom"
import { useSession } from "./useSession"

/** Déconnexion volontaire : révoque l'autorisation identity puis purge les tokens OIDC. */
export function useLogout() {
  const navigate = useNavigate()
  const { logout } = useSession()
  return async () => {
    await logout()
    void navigate("/login")
  }
}
