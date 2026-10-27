import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CloseButton } from "@/shared/components/close-button"
import { queryKeys } from "@/lib/query-keys"
import { useTopicOverview } from "@/features/topic-detail"
import { usePlayerProfile } from "@/features/player"
import { useMe, useTopicName } from "@/features/shell"
import { TOKEN } from "@/shared/theme/tokens"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { RoomInvite } from "../components/RoomInvite"
import { RoomWaitingScreen } from "../components/RoomWaitingScreen"
import { getSessionUserId } from "@/features/auth"
import { useRoom } from "../hooks/useRoom"
import { useLeaveRoom, useRoomJoin } from "../hooks/useRooms"
import { useRoomWizz } from "../hooks/useWizz"

/**
 * Salle d'attente d'une salle — reprend le langage visuel de la file de matchmaking
 * (fond duel, trame de points, anneaux de ping, sujet en pied d'écran). Dès que la partie
 * est créée, la salle redirige vers l'arène.
 */
export function RoomPage() {
  const { t } = useTranslation()
  const { roomId = "" } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { room, isLoading, isError, refresh } = useRoom(roomId)
  const leave = useLeaveRoom(roomId)
  const cancel = useLeaveRoom(roomId, true)
  const wizz = useRoomWizz(room, roomId)
  const goBack = useGoBack("/notifications")
  const topicQuery = useTopicOverview(room.topicId ?? "")
  const { data: me } = useMe()
  const resolveName = useTopicName()
  const meId = getSessionUserId()
  const meIsInitiator = room.initiatorId === meId
  const opponentId = meIsInitiator
    ? (room.participantId ?? room.opponentId)
    : room.initiatorId
  // Le bot n'a pas de profil : pas de requête (le nom vient du contrat de salle).
  const opponent = usePlayerProfile(room.vsBot ? "" : (opponentId ?? ""))

  // Apparition client-driven : la commande unique porte présence + enregistrement du participant.
  // Après succès, on rejoue l'historique REST : la trame `ROOM_ENTERED` peut avoir été manquée
  // entre le snapshot initial et la souscription STOMP, et l'anneau de présence resterait gris.
  const join = useRoomJoin(roomId, refresh)

  useEffect(() => {
    if (room.gameId) {
      // La partie vient d'être créée (transition 0 → 1) : le bandeau « Partie en cours » est
      // monté globalement mais ne sonde que si une partie est déjà connue — sans cette
      // invalidation, il n'apparaîtrait qu'au prochain refresh.
      void queryClient.invalidateQueries({ queryKey: queryKeys.games.active() })
      void navigate(`/game/${room.gameId}`, { replace: true })
    }
  }, [room.gameId, navigate, queryClient])

  if (
    room.status === "CANCELLED" ||
    room.status === "EXPIRED" ||
    room.status === "FAILED" ||
    isError
  ) {
    const title =
      room.status === "EXPIRED"
        ? t("game.room.expired")
        : room.status === "FAILED"
          ? t("game.room.failed")
          : room.status === "CANCELLED"
            ? t("game.room.canceled")
            : t("game.room.notFound")
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="font-heading text-lg font-bold">{title}</div>
          <Button className="w-full" onClick={goBack}>
            {t("game.common.back")}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading && !room.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        {t("game.room.preparing")}
      </div>
    )
  }

  const topic = topicQuery.data?.topic
  const nominative = room.opponentId !== null
  const canLeave = room.status === "WAITING_PLAYERS"
  const shareUrl = `${window.location.origin}/join/${roomId}`
  const cancelLabel = room.vsBot
    ? t("game.room.cancelDuel")
    : nominative
      ? t("game.room.cancelChallenge")
      : t("game.room.closeRoom")
  const opponentName = room.vsBot
    ? t("game.room.botName")
    : (opponent.data?.pseudonym ?? t("game.common.opponent"))
  // Relance « façon MSN » : proposée tant que l'adversaire nommé n'est pas là (les deux joueurs
  // peuvent relancer), grisée pendant la cadence anti-spam (compte à rebours sur l'horloge serveur).
  const wizzVisible = wizz.available || wizz.pending || wizz.cooldownSeconds > 0

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      {/* Retour : quitte l'écran sans fermer la salle tant que la préparation n'est pas engagée
          (une fois les deux présents, la salle ne peut plus être quittée — seul l'initiateur
          peut encore annuler en pied). */}
      {canLeave && (
        <CloseButton
          onClick={() => leave.mutate()}
          aria-label={t("game.room.leaveAria")}
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-[18px] z-20"
        />
      )}

      <RoomWaitingScreen
        topic={{
          name: resolveName(topic?.names, t("game.room.fallbackTopic")),
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
        status={room.status}
        player={{
          name: me?.pseudonym ?? t("game.common.you"),
          userId: meId ?? undefined,
          avatarOptions: me?.avatarOptions,
          present: meIsInitiator
            ? room.initiatorPresent
            : room.participantPresent,
          isMe: true,
        }}
        opponent={
          opponentId
            ? {
                name: opponentName,
                userId: room.vsBot ? undefined : opponentId,
                avatarOptions: room.vsBot ? null : opponent.data?.avatarOptions,
                present: meIsInitiator
                  ? room.participantPresent
                  : room.initiatorPresent,
                suspended: room.vsBot
                  ? false
                  : (opponent.data?.suspended ?? false),
              }
            : null
        }
        expiresAt={room.expiresAt}
      >
        {/* Partage (salle non nominative) dans le flux ; l'annulation vit en pied de page, centrée.
            Un défi nominatif n'a pas de partage social : la salle reste sur une colonne centrée. */}
        {!nominative && (
          <div className="flex w-full max-w-[380px] flex-col items-center gap-4">
            <RoomInvite
              shareUrl={shareUrl}
              topicName={topic ? resolveName(topic.names) : undefined}
            />
          </div>
        )}
      </RoomWaitingScreen>

      {/* Échec définitif de l'apparition (après reprises) : sans elle la salle ne peut pas
          démarrer et l'anneau de présence reste gris. Action de reprise explicite, jamais un
          toast (écran immersif). */}
      {join.failed && (
        <div className="relative z-10 flex shrink-0 flex-col items-center gap-3 px-6 pt-1 pb-4">
          <p
            className="max-w-[380px] text-center text-sm"
            style={{ color: TOKEN.mutedFg }}
          >
            {t("game.room.joinFailed")}
          </p>
          <Button
            variant="outline"
            className="w-full max-w-[380px]"
            onClick={join.retry}
          >
            {t("game.room.joinRetry")}
          </Button>
        </div>
      )}

      {/* Pied centré, hors colonnes : relance de l'adversaire absent (action primaire, les deux
          joueurs) au-dessus de l'annulation (initiateur seulement). */}
      {(wizzVisible || meIsInitiator) && (
        <div className="relative z-10 flex shrink-0 flex-col items-center gap-3 px-6 pt-1 pb-4">
          {wizzVisible && (
            <Button
              type="button"
              className="w-full max-w-[380px]"
              disabled={!wizz.available || wizz.pending}
              onClick={wizz.send}
              aria-label={t("game.room.wizz.aria", { name: opponentName })}
            >
              <Zap className="size-4" aria-hidden />
              {wizz.cooldownSeconds > 0
                ? t("game.room.wizz.cooldown", {
                    seconds: wizz.cooldownSeconds,
                  })
                : t("game.room.wizz.action")}
            </Button>
          )}
          {meIsInitiator && (
            <Button
              variant="destructive"
              className="w-full max-w-[380px]"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
