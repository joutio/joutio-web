import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  useAcceptChallenge,
  useCancelChallenge,
  useDeclineChallenge,
} from "@/features/challenges"
import { useCancelRoom } from "@/features/rooms"
import { useImmersiveNavigate } from "@/features/shell"
import { useResolveChallenge } from "@/features/notifications"
import { queryKeys } from "@/lib/query-keys"
import { showToast } from "@/shared/utils/toast"

export interface PendingDuelActions {
  /** Accepter une invitation : salle créée par la saga → navigation immersive. */
  accept: (challengeId: string) => Promise<void>
  decline: (challengeId: string) => Promise<void>
  cancelChallenge: (challengeId: string) => void
  cancelRoom: (roomId: string) => void
  openRoom: (roomId: string) => void
  acceptPending: boolean
  declinePending: boolean
  cancelPending: boolean
  cancelRoomPending: boolean
}

/**
 * Actions des cartes défis/salons empilées : vérification avant acceptation (défi annulé/déjà
 * tranché ⇒ message dédié, aucune commande), marquage lu de l'invitation, navigation immersive
 * vers la salle.
 */
export function usePendingDuelActions(): PendingDuelActions {
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const acceptChallenge = useAcceptChallenge()
  const declineChallenge = useDeclineChallenge()
  const resolveChallenge = useResolveChallenge()
  const cancelChallenge = useCancelChallenge()
  const cancelRoom = useCancelRoom()

  async function accept(challengeId: string): Promise<void> {
    const result = await acceptChallenge.accept(challengeId)
    if (result.status === "gone") {
      // Annulé/déjà tranché entre l'affichage et le clic : pas de commande ni de navigation.
      resolveChallenge(challengeId)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      showToast({
        tone: "info",
        title: t("social.pending.goneTitle"),
        description: t("social.pending.goneDescription"),
      })
      return
    }
    resolveChallenge(challengeId)
    navigate(result.roomId ? `/rooms/${result.roomId}` : "/notifications")
  }

  async function decline(challengeId: string): Promise<void> {
    await declineChallenge.decline(challengeId).catch(() => undefined)
    resolveChallenge(challengeId)
  }

  return {
    accept,
    decline,
    cancelChallenge: (challengeId) => cancelChallenge.mutate(challengeId),
    cancelRoom: (roomId) => cancelRoom.mutate(roomId),
    openRoom: (roomId) => navigate(`/rooms/${roomId}`),
    acceptPending: acceptChallenge.pending,
    declinePending: declineChallenge.pending,
    cancelPending: cancelChallenge.isPending,
    cancelRoomPending: cancelRoom.isPending,
  }
}
