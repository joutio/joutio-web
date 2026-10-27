import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAcceptChallenge, useDeclineChallenge } from "@/features/challenges"
import { useImmersiveNavigate } from "@/features/shell"
import { usePlayerProfile } from "@/features/player"
import { AppDialog } from "@/shared/components/app-dialog"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useRemainingSeconds } from "@/shared/hooks/useRemainingSeconds"
import { showToast } from "@/shared/utils/toast"
import { useMarkNotificationRead } from "../hooks/useNotifications"
import { useRematchRequestStore } from "../stores/useRematchRequestStore"

/**
 * Popup globale d'une **demande de revanche** reçue. Exception assumée à la règle « les défis
 * se tranchent sur leur carte » : la revanche a un TTL de 10 s, le destinataire doit pouvoir
 * répondre immédiatement sans quitter l'écran de résultat. La popup est montée par `AppShell`
 * uniquement hors immersion (page résultat autorisée) et se ferme d'elle-même à l'échéance.
 */
export function RematchRequestDialog() {
  const { t } = useTranslation()
  const request = useRematchRequestStore((state) => state.requests[0] ?? null)
  const remove = useRematchRequestStore((state) => state.remove)
  const markRead = useMarkNotificationRead()
  const acceptChallenge = useAcceptChallenge()
  const declineChallenge = useDeclineChallenge()
  const navigate = useImmersiveNavigate()
  const { serverNow } = useServerClock()
  const remainingSeconds = useRemainingSeconds(
    request?.expiresAt ?? null,
    serverNow
  )
  const player = usePlayerProfile(request?.actorId ?? "")
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null)

  const name = player.data?.pseudonym ?? t("social.pending.playerFallback")

  // Échéance serveur dépassée : la popup se ferme. La notification reste **non lue** si la
  // demande n'a jamais pu être affichée (immersion) — elle demeure une trace dans l'inbox.
  // Une acceptation en cours garde la popup ouverte le temps que la salle soit créée.
  useEffect(() => {
    if (!request || remainingSeconds > 0 || busy) return
    remove(request.notificationId)
  }, [request, remainingSeconds, busy, remove])

  if (!request || !request.sourceId || remainingSeconds <= 0) return null

  const finish = () => {
    remove(request.notificationId)
    markRead.mutate(request.notificationId)
  }

  const accept = async (): Promise<void> => {
    if (busy) return
    setBusy("accept")
    try {
      const result = await acceptChallenge.accept(request.sourceId!)
      if (result.status === "gone") {
        showToast({
          tone: "info",
          title: t("social.pending.goneTitle"),
          description: t("social.pending.goneDescription"),
        })
        finish()
        return
      }
      finish()
      navigate(
        result.roomId ? `/rooms/${result.roomId}` : "/challenges?type=received"
      )
    } catch {
      showToast({
        tone: "danger",
        title: t("social.rematchRequest.acceptFailed"),
      })
      finish()
    } finally {
      setBusy(null)
    }
  }

  const decline = async (): Promise<void> => {
    if (busy) return
    setBusy("decline")
    try {
      await declineChallenge.decline(request.sourceId!)
    } catch {
      // Déjà expirée/annulée : la popup se ferme de toute façon.
    } finally {
      finish()
      setBusy(null)
    }
  }

  // Fermer par la croix, Échap ou clic extérieur vaut refus explicite : la demande ne doit pas
  // rester PENDING dans le dos du joueur. Le bouton « Refuser » reste l'action visible dédiée.
  const close = (): void => {
    if (busy) return
    void decline()
  }

  return (
    <AppDialog
      open
      onClose={close}
      dismissible={busy === null}
      showCloseButton={busy === null}
      footerClassName="flex-row"
      title={t("social.rematchRequest.title")}
      sub={t("social.rematchRequest.countdown", {
        seconds: remainingSeconds,
      })}
      footer={
        <>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => void decline()}
          >
            {t("social.rematchRequest.decline")}
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => void accept()}
          >
            {busy === "accept"
              ? t("social.rematchRequest.accepting")
              : t("social.rematchRequest.accept")}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <UserAvatar
          name={name}
          userId={request.actorId ?? undefined}
          avatarOptions={player.data?.avatarOptions ?? undefined}
          size={44}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {t("social.rematchRequest.description", { name })}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Swords className="size-3.5 shrink-0" aria-hidden />
            {t("social.rematchRequest.hint")}
          </p>
        </div>
      </div>
    </AppDialog>
  )
}
