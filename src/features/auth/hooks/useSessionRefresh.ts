import { useEffect } from "react"
import { refreshSessionOrEnd } from "../lib/oidc"
import { useSessionStore } from "../stores/useSessionStore"

/** Fréquence de vérification de l'échéance de l'access token. */
const TICK_MS = 60_000
/** Renouvellement anticipé : dès que l'access token expire dans moins de 5 min. */
const REFRESH_MARGIN_MS = 5 * 60_000

/**
 * Renouvellement **piloté** de la session (l'`automaticSilentRenew` d'`oidc-client-ts` est
 * désactivé) : vérifie l'échéance chaque minute et à la reprise d'onglet/réseau, et renouvelle
 * silencieusement dès que l'access token approche de l'expiration. Un échec définitif termine
 * la session (`expired`) ; un échec transitoire est simplement retenté au tick suivant.
 */
export function useSessionRefresh(): void {
  const authenticated = useSessionStore((state) => state.user !== null)

  useEffect(() => {
    if (!authenticated) return

    const renewIfNeeded = () => {
      const user = useSessionStore.getState().user
      if (!user) return
      const expiresAtMs = (user.expires_at ?? 0) * 1000
      if (expiresAtMs - Date.now() < REFRESH_MARGIN_MS) {
        void refreshSessionOrEnd()
      }
    }

    renewIfNeeded()
    const timer = window.setInterval(renewIfNeeded, TICK_MS)
    const onVisibility = () => {
      if (document.visibilityState === "visible") renewIfNeeded()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", renewIfNeeded)
    window.addEventListener("pageshow", renewIfNeeded)
    window.addEventListener("online", renewIfNeeded)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", renewIfNeeded)
      window.removeEventListener("pageshow", renewIfNeeded)
      window.removeEventListener("online", renewIfNeeded)
    }
  }, [authenticated])
}
