import { useEffect } from "react"
import { useSession } from "@/features/auth"
import { isStandalone } from "@/shared/utils/pwa"
import { isPushSupported } from "../domain/push"
import { enableBrowserPush } from "../lib/push-client"

const FIRST_RUN_KEY = "joutio.push.firstRunAsked"

/**
 * Première ouverture de la PWA installée (une seule tentative, mémorisée) : demande la permission
 * push puis souscrit. iOS exige un geste utilisateur — la tentative y échoue silencieusement,
 * l'activation reste possible depuis les Réglages. `usePushSubscriptionSync` prend le relais aux
 * ouvertures suivantes si la permission a été accordée.
 */
export function useFirstRunPushPrompt(): void {
  const { authenticated, userId } = useSession()

  useEffect(() => {
    if (!authenticated || !userId) return
    if (!isStandalone() || !isPushSupported()) return
    if (Notification.permission !== "default") return
    try {
      if (localStorage.getItem(FIRST_RUN_KEY)) return
      localStorage.setItem(FIRST_RUN_KEY, "1")
    } catch {
      // Stockage indisponible (navigation privée) : on tente sans mémoriser.
    }
    void enableBrowserPush(userId).catch(() => undefined)
  }, [authenticated, userId])
}
