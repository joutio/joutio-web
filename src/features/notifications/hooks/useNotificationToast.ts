import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { isSentRematch } from "@/features/challenges"
import { useImmersiveNavigate } from "@/features/shell"
import type { NotificationView } from "@/shared/types/notifications"
import { showToast } from "@/shared/utils/toast"
import { notificationToast } from "../domain/notification"
import { DEFAULT_TOAST_ICON, TOAST_ICONS } from "../lib/toast-icons"
import { useMarkNotificationRead } from "./useNotifications"

/**
 * Affiche le toast cliquable d'une notification (gabarit unique). Le clic vaut lecture et
 * navigue vers la cible ; un toast déjà à destination est inutile et n'est pas affiché.
 * Utilisé par le flux STOMP, le push relayé et le rejeu des toasts différés par l'immersion.
 */
export function useNotificationToast(): (
  notification: NotificationView
) => void {
  const { t } = useTranslation()
  const navigate = useImmersiveNavigate()
  const { mutate: markRead } = useMarkNotificationRead()

  return useCallback(
    (notification: NotificationView) => {
      // L'écran de résultat porte déjà l'issue de sa revanche (bouton + toast dédié) : le
      // toast d'inbox ferait doublon. La notification est quand même marquée lue.
      if (
        notification.type === "CHALLENGE_DECLINED" &&
        isSentRematch(notification.sourceId)
      ) {
        markRead(notification.notificationId)
        return
      }
      const content = notificationToast(notification, t)
      if (!content) return
      // Déjà à destination (ex. dans la salle, la carte Social) : inutile de proposer d'y aller.
      const current = `${window.location.pathname}${window.location.search}`
      if (content.path && current === content.path) return
      showToast({
        tone: content.tone ?? null,
        icon: TOAST_ICONS[notification.type] ?? DEFAULT_TOAST_ICON,
        title: content.title,
        description: content.description,
        id: `notification-${notification.notificationId}`,
        duration: 6_000,
        onClick: () => {
          // Le clic vaut lecture, même si la carte a été rendue à partir d'un push dont le
          // `readAt` initial est null : la commande est idempotente côté serveur.
          markRead(notification.notificationId)
          if (content.path) navigate(content.path)
        },
      })
    },
    [markRead, navigate, t]
  )
}
