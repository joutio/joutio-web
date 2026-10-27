import { useEffect } from "react"
import { usePendingNotificationToastStore } from "../stores/usePendingNotificationToastStore"
import { useRematchRequestStore } from "../stores/useRematchRequestStore"
import { useNotificationToast } from "./useNotificationToast"

/**
 * Rejoue les toasts mis en attente pendant un écran immersif dès que l'affichage redevient
 * autorisé (écran normal, ou page résultat d'un duel). Le drain est atomique : un toast déjà
 * présenté n'est jamais rejoué.
 */
export function useFlushPendingNotificationToasts(deferToasts: boolean): void {
  const showNotificationToast = useNotificationToast()
  const drain = usePendingNotificationToastStore((state) => state.drain)
  const clear = usePendingNotificationToastStore((state) => state.clear)
  const clearRematchRequests = useRematchRequestStore((state) => state.clear)

  // Les files sont éphémères et liées à la session : on les purge avec la coquille (logout).
  useEffect(
    () => () => {
      clear()
      clearRematchRequests()
    },
    [clear, clearRematchRequests]
  )

  useEffect(() => {
    if (deferToasts) return
    for (const notification of drain()) {
      showNotificationToast(notification)
    }
  }, [deferToasts, drain, showNotificationToast])
}
