import { useTranslation } from "react-i18next"
import { getSessionUserId as getUserId } from "@/features/auth"
import type { FollowPresence } from "@/features/player/domain/presence"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import { showToast } from "@/shared/utils/toast"

/**
 * Toasts éphémères « X est en ligne » : le BFF pousse sur `/topic/follow-presence/{userId}`
 * quand un joueur suivi passe en ligne (aucune persistance). Même gabarit que les autres toasts
 * (avatar du joueur en visuel de tête), le clic ferme le toast ; aucun toast sur les écrans
 * immersifs (duel/salons) pour ne pas polluer la partie.
 */
export function useFollowPresenceToasts(immersive = false): void {
  const userId = getUserId()
  const { t } = useTranslation()

  useStompSubscription(
    "profile",
    userId ? `/topic/follow-presence/${userId}` : null,
    (message) => {
      if (immersive) return
      let presence: FollowPresence
      try {
        presence = JSON.parse(message.body) as FollowPresence
      } catch {
        return
      }
      if (!presence.actorId) return
      const name =
        presence.pseudonym ?? t("notifications.presence.playerFallback")
      showToast({
        actor: {
          userId: presence.actorId,
          name,
          avatarOptions: presence.avatarOptions,
        },
        title: t("notifications.presence.online", { name }),
        description: t("notifications.presence.hint"),
        id: `follow-online-${presence.actorId}`,
        duration: 5_000,
        dismissOnClick: true,
      })
    }
  )
}
