import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useTopicOverview } from "@/features/topic-detail"
import { useTopicName } from "@/features/shell"
import { BotTrainingDialog } from "@/features/game"
import { useStartBotGame } from "@/features/rooms"
import { trackProductEvent } from "@/lib/telemetry"
import { TOKEN } from "@/shared/theme/tokens"
import { SearchingScreen } from "../components/SearchingScreen"
import { NoOpponentDialog } from "../components/NoOpponentDialog"
import {
  useCancelMatchmaking,
  useMatchmakingTicket,
  useStartMatchmaking,
} from "../hooks/useMatchmaking"
import { useMatchmakingPreferencesStore } from "../stores/useMatchmakingPreferencesStore"

/**
 * Écran de recherche d'appariement public (« Défier le monde »). Bascule automatique vers la
 * salle dès que l'appariement aboutit (adversaire humain). À l'échéance (10 s) sans adversaire,
 * le ticket **expire** et la page propose de relancer une recherche, de s'entraîner contre un
 * robot (choix de difficulté) ou d'**annuler** (retour natif) — aucun repli bot automatique.
 *
 * Quitter l'écran pendant la recherche **annule le ticket** : sans notification d'appariement,
 * c'est le seul moyen d'éviter une salle (et un adversaire) orphelins.
 */
export function MatchmakingPage() {
  const { t } = useTranslation()
  const { ticketId = "" } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { ticket, isLoading, isError } = useMatchmakingTicket(ticketId)
  const cancel = useCancelMatchmaking(ticketId)
  const startMatchmaking = useStartMatchmaking()
  const startBot = useStartBotGame()
  const autoTrainOnTimeout = useMatchmakingPreferencesStore(
    (state) => state.autoTrainOnTimeout
  )
  const topicQuery = useTopicOverview(ticket.topicId ?? "")
  const resolveName = useTopicName()
  // Sortie : retour **d'où l'on vient** (la fiche du sujet), repli sur cette fiche en lien direct.
  const goBack = useGoBack(ticket.topicId ? `/topics/${ticket.topicId}` : "/")
  const [trainOpen, setTrainOpen] = useState(false)

  const statusRef = useRef(ticket.status)
  const cancelRef = useRef(cancel)
  const pendingCancel = useRef<number | null>(null)
  const expiredTracked = useRef(false)
  const autoStarted = useRef(false)

  useEffect(() => {
    statusRef.current = ticket.status
    if (ticket.status !== "EXPIRED") {
      expiredTracked.current = false
      autoStarted.current = false
      return
    }

    if (!expiredTracked.current) {
      expiredTracked.current = true
      trackProductEvent("matchmaking_expired", {
        auto: String(autoTrainOnTimeout),
      })
    }

    if (
      autoTrainOnTimeout &&
      ticket.topicId &&
      !autoStarted.current &&
      !startBot.isPending
    ) {
      autoStarted.current = true
      trackProductEvent("duel_start_requested", {
        mode: "bot",
        auto: "true",
      })
      startBot.mutate({ topicId: ticket.topicId, difficulty: "NORMAL" })
    }
  }, [autoTrainOnTimeout, startBot, ticket.status, ticket.topicId])

  useEffect(() => {
    cancelRef.current = cancel
  }, [cancel])

  useEffect(() => {
    // Au (re)montage : annule le cancel programmé par le cleanup de test de StrictMode.
    if (pendingCancel.current !== null) {
      window.clearTimeout(pendingCancel.current)
      pendingCancel.current = null
    }
    return () => {
      if (statusRef.current !== "SEARCHING") return
      pendingCancel.current = window.setTimeout(() => {
        pendingCancel.current = null
        void cancelRef.current.mutateAsync().catch(() => undefined)
      }, 0)
    }
  }, [])

  useEffect(() => {
    if (ticket.status === "MATCHED" && ticket.roomId) {
      void navigate(`/rooms/${ticket.roomId}`, { replace: true })
    }
  }, [ticket.status, ticket.roomId, navigate])

  if (ticket.status === "CANCELLED" || ticket.status === "FAILED" || isError) {
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="font-heading text-lg font-bold">
            {ticket.status === "FAILED"
              ? t("game.matchmaking.failed")
              : t("game.matchmaking.canceled")}
          </div>
          <Button className="w-full" onClick={goBack}>
            {t("game.common.back")}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading && !ticket.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        {t("game.matchmaking.searching")}
      </div>
    )
  }

  const topic = topicQuery.data?.topic
  const topicId = ticket.topicId
  const expired = ticket.status === "EXPIRED"
  const autoStarting =
    expired && autoTrainOnTimeout && !!topicId && startBot.isPending
  const showNoOpponent =
    expired &&
    !trainOpen &&
    (!autoTrainOnTimeout || !topicId || startBot.isError)

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <SearchingScreen
        deadlineAt={ticket.deadlineAt}
        topic={{
          name: resolveName(topic?.names, t("game.matchmaking.topicFallback")),
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
      />
      {autoStarting && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 px-6 text-center">
          <p className="text-sm font-semibold" style={{ color: TOKEN.fg }}>
            {t("game.matchmaking.autoTraining")}
          </p>
          <p className="mt-1 text-xs" style={{ color: TOKEN.mutedFg }}>
            {t("game.matchmaking.autoTrainingHint")}
          </p>
        </div>
      )}
      {!expired && (
        <div className="relative z-10 flex shrink-0 justify-center px-6 pt-1 pb-4">
          <Button
            variant="destructive"
            className="w-full max-w-[380px]"
            disabled={cancel.isPending}
            onClick={() =>
              cancel.mutate(undefined, { onSuccess: () => goBack() })
            }
          >
            {t("game.matchmaking.cancel")}
          </Button>
        </div>
      )}

      <NoOpponentDialog
        open={showNoOpponent}
        retryPending={startMatchmaking.isPending}
        onRetry={() => {
          if (!topicId) return
          trackProductEvent("duel_start_requested", { mode: "public" })
          startMatchmaking.mutate(topicId)
        }}
        onTrain={() => setTrainOpen(true)}
        onCancel={goBack}
      />
      <BotTrainingDialog
        open={trainOpen}
        pending={startBot.isPending}
        onClose={() => setTrainOpen(false)}
        onStart={(difficulty) => {
          if (!topicId) return
          trackProductEvent("duel_start_requested", { mode: "bot" })
          startBot.mutate({ topicId, difficulty })
        }}
      />
    </div>
  )
}
