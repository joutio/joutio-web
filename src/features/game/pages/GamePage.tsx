import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { personColor } from "@/shared/utils/person-color"
import { profilesService } from "@/features/player"
import { useMe, useTopicName } from "@/features/shell"
import { useTopicOverview } from "@/features/topic-detail"
import { getSessionUserId as getUserId } from "@/features/auth"
import { useCountdownTicks } from "@/shared/hooks/useCountdownTicks"
import { queryKeys } from "@/lib/query-keys"
import { TOKEN } from "@/shared/theme/tokens"
import { preloadImage } from "@/shared/utils/image-preload"
import type { BotDifficulty } from "../domain/game-dto"
import { ArenaPlaceholder } from "../components/ArenaPlaceholder"
import { CanceledGameScreen } from "../components/CanceledGameScreen"
import { CircleTransition } from "../components/CircleTransition"
import { DuelArenaView } from "../components/DuelArenaView"
import { VersusScreen } from "../components/versus/VersusScreen"
import { CATCH_UP_INTERVAL_MS } from "../domain/game-constants"
import { useDuelArena } from "../hooks/useDuelArena"
import { useDuelSounds } from "../hooks/useDuelSounds"
import { useStartBotGame } from "@/features/rooms"
import { useGameState } from "../hooks/useGameState"
import { useStartMatchmaking } from "@/features/matchmaking"
import { useServerClock } from "@/shared/clock/useServerClock"

/**
 * Arène de duel. Tout l'état dynamique est dérivé du read model `GameState` (fold des
 * notifications REST + WebSocket), projeté en une **scène unique** par `sceneAt` (cf.
 * `useDuelArena`) : plus de booléens de phase ad hoc, les animations suivent les fenêtres
 * temporelles du serveur.
 *
 * <p>`key={gameId}` garantit qu'un changement de partie (revanche, rejouer) repart d'un état
 * local vierge — sinon un état terminal (`arrivedFinished`, sélection en attente) fuitait d'une
 * partie à l'autre et court-circuitait les intros.</p>
 */
export function GamePage() {
  const { gameId = "" } = useParams<{ gameId: string }>()
  return <GameArena key={gameId} gameId={gameId} />
}

function GameArena({ gameId }: { gameId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = getUserId() ?? ""
  const { data: me } = useMe()
  const startDuel = useStartBotGame()
  const startMatchmaking = useStartMatchmaking()
  const { serverNow, synced, resync } = useServerClock()
  const { game, isLoading, isError, isRetrying, isLagging, refresh } =
    useGameState(gameId)
  const topicQuery = useTopicOverview(game.topicId ?? "")

  const [now, setNow] = useState(() => serverNow())

  const language = me?.language ?? "fr"
  const arena = useDuelArena({
    gameId,
    game,
    now,
    serverNow,
    userId,
    language,
    refresh,
  })
  const { scene } = arena

  // Sons de l'arène : une réaction par round (bonne/mauvaise réponse, temps écoulé) puis la
  // salve d'accumulation de points pour mes bonnes réponses — jamais rejouée au rechargement,
  // cf. `useDuelSounds`.
  useDuelSounds({
    scene,
    roundIndex: arena.roundIndex,
    yourCorrect: arena.yourCorrect,
    yourPick: arena.yourPick,
    theirPick: arena.theirPick,
    yourGain: arena.gain?.you ?? 0,
  })

  // Tic-tac du chrono de réponse : il **s'estompe dès que j'ai répondu** (réponse envoyée ou
  // écho reçu : plus rien à chronométrer de mon côté) et **reprend au round suivant**, quand le
  // timer redémarre. Même motif que les autres countdowns (tension sur les 3 dernières secondes).
  const answered = arena.yourPick != null || arena.pendingChoice != null
  useCountdownTicks({
    deadlineAt: answered ? null : arena.answerDeadlineAt,
    clock: serverNow,
    displaySeconds: "ceil", // l'arène affiche la seconde entamée
  })

  // Précharge toutes les images de questions dès la création de la partie : sur une connexion
  // faible, elles sont déjà en cache quand chaque round se révèle.
  useEffect(() => {
    game.questionImageUrls.forEach((url) => preloadImage(url))
  }, [game.questionImageUrls])

  // Fin de partie : la page résultat dédiée prend le relais (REST `/result` + revue) — mais
  // seulement une fois que la scène projetée bascule sur `result`. La timeline laisse la
  // révélation du dernier round durer `RESULT_DELAY_MS` (même durée qu'une transition de round
  // normale) pour que les animations de score/jauge se terminent avant la transition. Les
  // parties annulées (no-show, expirée) restent gérées ici (pas d'issue sportive).
  useEffect(() => {
    if (scene.kind === "result" && game.status === "FINISHED") {
      void navigate(`/game/${gameId}/result`, { replace: true })
    }
  }, [scene.kind, game.status, gameId, navigate])

  // Horloge : `now` rafraîchi par intervalle — pilote les fenêtres d'animation et le décompte
  // dérivés des instants serveur. Inutile sur l'écran de résultat.
  useEffect(() => {
    if (scene.kind === "result") return
    const interval = setInterval(() => setNow(serverNow()), 50)
    return () => clearInterval(interval)
  }, [scene.kind, serverNow])

  // Reprise après suspension d'onglet / coupure réseau : l'horloge est re-mesurée et
  // l'historique rejoué — sans cela, un onglet mobile gelé restait sur un état périmé.
  useEffect(() => {
    const onResume = () => {
      resync()
      refresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") onResume()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onResume)
    window.addEventListener("pageshow", onResume)
    window.addEventListener("online", onResume)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onResume)
      window.removeEventListener("pageshow", onResume)
      window.removeEventListener("online", onResume)
    }
  }, [resync, refresh])

  // Rattrapage REST : une transition serveur attendue n'est pas arrivée, ou l'écho de ma
  // réponse tarde → on rejoue l'historique au lieu d'attendre le reconnect WS (jusqu'à 30 s).
  const needsCatchUp = synced && (scene.overdue || arena.pendingEchoOverdue)

  useEffect(() => {
    if (!needsCatchUp) return
    refresh()
    const interval = setInterval(refresh, CATCH_UP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [needsCatchUp, refresh])

  // Diagnostic dev : trace les transitions de scène et les resynchronisations pour pouvoir
  // confirmer/infirmer une désynchro sans accès à la console de l'utilisateur.
  const lastSceneRef = useRef("")
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const label =
      scene.kind === "question" ||
      scene.kind === "reveal" ||
      scene.kind === "roundIntro"
        ? `${scene.kind}:${scene.round}`
        : scene.kind
    if (lastSceneRef.current === label) return
    lastSceneRef.current = label
    console.debug("[duel] scène", label, {
      overdue: scene.overdue,
      lagging: isLagging,
      status: game.status,
    })
  }, [scene, isLagging, game.status])

  // Avatars réels des deux joueurs (profil = source des options d'avatar).
  const opponentProfileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(arena.opponentId ?? ""),
    queryFn: () => profilesService.profile(arena.opponentId ?? ""),
    enabled: !!arena.opponentId,
    staleTime: 10 * 60 * 1000,
  })
  const playerAvatar = {
    userId: userId || undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }
  const opponentAvatar = {
    userId: arena.opponentId ?? undefined,
    avatarOptions: opponentProfileQuery.data?.avatarOptions ?? undefined,
  }

  const opponent = game.player2Type
  const opponentName =
    (arena.isPlayer1 ? game.player2Name : game.player1Name) ||
    t("game.common.opponent")
  const opponentColor = arena.opponentId
    ? personColor(arena.opponentId)
    : TOKEN.primary

  const playerRating = me?.progression.rating ?? 200
  const playerName = me?.pseudonym ?? t("game.common.you")
  const resolveName = useTopicName()
  const topic = topicQuery.data?.topic
  const topicName = resolveName(topic?.names, "")

  if (isLoading) {
    return (
      <ArenaPlaceholder
        message={
          isRetrying ? t("game.arena.reconnecting") : t("game.arena.preparing")
        }
      />
    )
  }

  if (isError || game.player1Id == null) {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <EmptyState title={t("game.arena.notFound")}>
          <Button variant="outline" onClick={() => void navigate("/topics")}>
            {t("game.common.backToTopics")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  const topicId = game.topicId ?? ""

  // Transitoire : la partie démarre immédiatement (présence garantie par le salon), le temps
  // que la trame `GAME_STARTED` (firstRoundAt) arrive.
  if (scene.kind === "waiting") {
    return <ArenaPlaceholder message={t("game.arena.preparing")} />
  }

  if (scene.kind === "vs" || scene.kind === "swoosh") {
    return (
      <div
        className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
        style={{ background: TOKEN.duelBg }}
      >
        <VersusScreen
          player={{
            name: playerName,
            rating: playerRating,
            country: me?.country ?? undefined,
            userId: playerAvatar.userId,
            avatarOptions: playerAvatar.avatarOptions,
          }}
          opponent={{
            name: opponentName,
            color: opponentColor,
            userId: opponentAvatar.userId,
            avatarOptions: opponentAvatar.avatarOptions,
          }}
          topic={{
            name: topicName,
            emoji: topic?.emoji ?? undefined,
            color: topic?.color ?? undefined,
            imageUrl: topic?.imageUrl ?? undefined,
          }}
        />
        {scene.kind === "swoosh" && (
          <CircleTransition elapsedMs={scene.elapsedMs} />
        )}
      </div>
    )
  }

  if (scene.kind === "result") {
    if (game.status === "CANCELED") {
      return (
        <CanceledGameScreen
          canceledReason={game.canceledReason}
          humanOpponent={opponent === "HUMAN"}
          replayPending={startDuel.isPending || startMatchmaking.isPending}
          onBackToTopic={() => void navigate(`/topics/${topicId}`)}
          onReplay={() => {
            if (opponent === "HUMAN") {
              startMatchmaking.mutate(topicId)
            } else {
              startDuel.mutate({
                topicId,
                difficulty: (game.botDifficulty as BotDifficulty) ?? "NORMAL",
              })
            }
          }}
        />
      )
    }

    // Fin normale : la page résultat dédiée prend le relais (redirect en effet ci-dessus).
    // On affiche un simple écran d'attente le temps de la navigation (évite un flash d'arène).
    return <ArenaPlaceholder duel message={t("game.result.preparing")} />
  }

  return (
    <DuelArenaView
      arena={arena}
      playerName={playerName}
      opponentName={opponentName}
      playerAvatar={playerAvatar}
      opponentAvatar={opponentAvatar}
      topic={topic}
      topicName={topicName}
    />
  )
}
