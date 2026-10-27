import { useEffect } from "react"
import { useUnreadNotificationsCount } from "./useNotifications"

/**
 * Badge d'icône de la PWA (Badging API) : reflète le compteur de notifications non lues sur
 * l'icône installée. Sans support navigateur, no-op silencieux.
 */
export function useAppBadge(): void {
  const { data } = useUnreadNotificationsCount()
  const count = data?.count ?? 0

  useEffect(() => {
    if (typeof navigator === "undefined") return
    if (count > 0) {
      if ("setAppBadge" in navigator) {
        void navigator.setAppBadge(count).catch(() => undefined)
      }
    } else if ("clearAppBadge" in navigator) {
      void navigator.clearAppBadge().catch(() => undefined)
    }
  }, [count])
}
