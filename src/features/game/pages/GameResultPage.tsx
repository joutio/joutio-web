import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { profilesService } from "@/features/player"
import { ReportUserDialog } from "@/features/moderation"
import { useMe, useTopicName } from "@/features/shell"
import { getSessionUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import { TOKEN } from "@/shared/theme/tokens"
import { ArenaPlaceholder } from "../components/ArenaPlaceholder"
import { useGameResult } from "../hooks/useGameResult"
import { useGameResultSettlement } from "../hooks/useGameResultSettlement"
import { useGameReview } from "../hooks/useGameReview"
import { useResultSound } from "../hooks/useResultSound"
import { useRingAccumulationSound } from "../hooks/useRingAccumulationSound"
import { useStartBotGame } from "@/features/rooms"
import { useRematchChallenge } from "@/features/challenges"
import { useStartMatchmaking } from "@/features/matchmaking"
import { useEloRatingStore } from "@/shared/elo/elo-rating-store"
import { useTopicDuelState } from "@/features/social"
import { trackProductEvent } from "@/lib/telemetry"
import { isGameAccessDenied, resultOutcome } from "../domain/game"
import { buildReviewRounds } from "../domain/review"
import { ResultScreen } from "../components/result/ResultScreen"
import { QuestionReviewDialog } from "../components/QuestionReviewDialog"
import { ReviewDeck } from "../components/ReviewDeck"

/**
 * Page résultat dédiée (`/game/:gameId/result`) : s'appuie sur `GET /api/games/{id}/result`
 * (bilan autoritaire, sujet et adversaire enrichis) et sur **un seul** chargement REST de
 * l'historique pour la revue — aucun abonnement WebSocket, aucune horloge, aucun calcul
 * d'arène. Desktop : pile résultat à gauche, carousel **shadcn** de questions à droite **quand
 * il y a des questions à revoir** (sinon pile seule centrée) ; tactile : pile + bottom sheet
 * DETAILS. Les deux surfaces partagent le même `ReviewDeck`.
 */
export function GameResultPage() {
  const { gameId = "" } = useParams<{ gameId: string }>()
  return <GameResult key={gameId} gameId={gameId} />
}

function GameResult({ gameId }: { gameId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isTouch = useIsTouchLayout()
  const { data: me, userId: sessionUserId } = useMe()
  const userId = sessionUserId ?? getSessionUserId() ?? ""
  const resolveName = useTopicName()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportedOpponent, setReportedOpponent] = useState(false)
  const resultTracked = useRef(false)

  const resultQuery = useGameResult(gameId)
  // Résultat privé : la revue n'est chargée qu'une fois le résultat autorisé. Un tiers reçoit
  // un 403 sur `/result` et ne déclenche donc jamais `/notifications`.
  const reviewQuery = useGameReview(gameId, {
    enabled: resultQuery.isSuccess,
  })
  const result = resultQuery.data
  const game = reviewQuery.data

  // Garde : une partie encore en cours (ou annulée — no-show/expirée) n'a pas de page résultat
  // sportive → retour à l'arène (qui gère l'écran dédié des annulations).
  useEffect(() => {
    if (game?.status === "IN_PROGRESS" || game?.status === "CANCELED") {
      void navigate(`/game/${gameId}`, { replace: true })
    }
  }, [game?.status, gameId, navigate])

  // Fin de partie : rafraîchit progression/accueil/sujets/profils (deux passes — la projection
  // Axon d'XP/rangs est différée).
  useGameResultSettlement(gameId)

  const isPlayer1 = game?.player1Id === userId
  const opponentId =
    result?.opponentId ??
    (isPlayer1 ? (game?.player2Id ?? null) : (game?.player1Id ?? null))
  const opponentDeleted = result?.opponentDeleted ?? false
  const opponentName =
    result?.opponent?.pseudonym ??
    (opponentDeleted
      ? t("game.common.deletedPlayer")
      : isPlayer1
        ? game?.player2Name
        : game?.player1Name) ??
    t("game.common.opponent")
  const playerName = me?.pseudonym ?? t("game.common.you")
  const language = me?.language ?? "fr"

  // Avatar adverse : porté par la vue résultat (profil enrichi côté BFF) ; repli profil direct.
  const opponentProfileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(opponentId ?? ""),
    queryFn: () => profilesService.profile(opponentId as string),
    enabled: !!opponentId && !opponentDeleted && !result?.opponent,
    staleTime: 10 * 60 * 1000,
  })

  const playerAvatar = {
    userId: userId || undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }
  const opponentAvatar = {
    userId: opponentDeleted ? undefined : (opponentId ?? undefined),
    avatarOptions: opponentDeleted
      ? undefined
      : (result?.opponent?.avatarOptions ??
        opponentProfileQuery.data?.avatarOptions ??
        undefined),
    initialOnly: opponentDeleted,
  }

  const reviewRounds = useMemo(
    () => (game ? buildReviewRounds(game, userId, opponentId) : []),
    [game, userId, opponentId]
  )

  const topicId = result?.topic?.topicId ?? game?.topicId ?? null
  const duelState = useTopicDuelState(topicId ?? "")
  const exitResult = useGoBack(topicId ? `/topics/${topicId}` : "/")
  const rematch = useRematchChallenge()
  const startMatchmaking = useStartMatchmaking()
  const startDuel = useStartBotGame()

  // Le rating vient de changer : les cadres d'avatar doivent relire le batch.
  useEffect(() => {
    useEloRatingStore.getState().clear()
  }, [result?.reward?.xp])

  // Sons de l'écran : ils ne partent **qu'une fois la page réellement affichée** (bilan **et**
  // revue chargés) — tant que l'écran montre « préparation », aucun jingle ni salve d'XP.
  const soundOutcome =
    result != null && game != null
      ? resultOutcome(result.winnerId, userId)
      : null
  useResultSound(soundOutcome)

  // Accumulation d'XP : même salve que l'arène, **solidaire du visuel** — le donut s'anime dès
  // que la récompense est projetée (à l'entrée de la page, le plus souvent), la salve part avec.
  useRingAccumulationSound(
    result != null && game != null ? (result.reward?.xp ?? null) : null
  )

  useEffect(() => {
    if (!result || !game || resultTracked.current) return
    resultTracked.current = true
    trackProductEvent("result_viewed", {
      outcome: resultOutcome(result.winnerId, userId),
      bot: String(result.botGame),
    })
  }, [game, result, userId])

  if (resultQuery.isError || reviewQuery.isError) {
    const forbidden = isGameAccessDenied(resultQuery.error ?? reviewQuery.error)
    return (
      <div
        className="qu-immersive-safe grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <EmptyState
          title={
            forbidden ? t("game.result.forbidden") : t("game.result.notFound")
          }
          description={
            forbidden ? t("game.result.forbiddenDescription") : undefined
          }
        >
          <Button variant="outline" onClick={() => void navigate("/topics")}>
            {t("game.common.backToTopics")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  if (!result || !game) {
    return <ArenaPlaceholder duel message={t("game.result.preparing")} />
  }

  const outcome: "win" | "loss" | "draw" = resultOutcome(
    result.winnerId,
    userId
  )
  const forfeit: "you" | "opponent" | null = game.forfeiterId
    ? game.forfeiterId === userId
      ? "you"
      : "opponent"
    : null
  const topicName = result.topic ? resolveName(result.topic.names, "") : ""

  return (
    <>
      <ResultScreen
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        playerRating={result.progression.rating ?? 200}
        opponentRating={result.opponentRating ?? null}
        playerEloDelta={result.eloDelta ?? 0}
        playerRated={result.rated ?? false}
        opponentEloDelta={result.opponentEloDelta ?? 0}
        opponentRated={result.opponentRated ?? false}
        scores={{ you: result.myScore, them: result.opponentScore }}
        outcome={outcome}
        forfeit={forfeit}
        topicName={topicName}
        result={result}
        botGame={result.botGame}
        onChallengeRematch={() => {
          if (opponentId && topicId) {
            trackProductEvent("duel_start_requested", { mode: "challenge" })
            rematch.start({ topicId, opponentId, gameId })
          }
        }}
        rematchPending={rematch.pending}
        rematchRemainingSeconds={rematch.remainingSeconds}
        rematchRefused={rematch.refused}
        rematchBlocked={duelState.challengeInProgressOnTopic}
        rematchUnavailable={opponentDeleted}
        onOpenReview={() => setReviewOpen(true)}
        canReview={reviewRounds.length > 0}
        reviewPane={
          !isTouch && reviewRounds.length > 0 ? (
            <ReviewDeck
              game={game}
              userId={userId}
              opponentId={opponentId}
              playerName={playerName}
              opponentName={opponentName}
              playerAvatar={playerAvatar}
              opponentAvatar={opponentAvatar}
              language={language}
              label={t("game.review.carouselLabel")}
            />
          ) : undefined
        }
        onNewOpponent={() => {
          if (!topicId) return
          trackProductEvent("duel_start_requested", { mode: "public" })
          startMatchmaking.mutate(topicId)
        }}
        onReplayBot={() => {
          if (!topicId) return
          trackProductEvent("duel_start_requested", { mode: "bot" })
          startDuel.mutate({
            topicId,
            difficulty: result.botDifficulty ?? "NORMAL",
          })
        }}
        newOpponentPending={startMatchmaking.isPending}
        replayPending={startDuel.isPending}
        onExit={exitResult}
        reportable={!result.botGame && Boolean(opponentId) && !opponentDeleted}
        reported={reportedOpponent}
        onReportOpponent={() => setReportOpen(true)}
        opponentSuspended={result.opponent?.suspended ?? false}
      />

      {isTouch && (
        <QuestionReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          game={game}
          userId={userId}
          opponentId={opponentId}
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          language={language}
        />
      )}

      {opponentId && !result.botGame && !opponentDeleted ? (
        <ReportUserDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetUserId={opponentId}
          targetPseudonym={opponentName}
          targetAvatarOptions={opponentAvatar.avatarOptions}
          gameId={gameId}
          onReported={() => setReportedOpponent(true)}
        />
      ) : null}
    </>
  )
}
