import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CloseButton } from "@/shared/components/close-button"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import type { GameResultView } from "../../domain/game-dto"
import { usePullUpReview } from "../../hooks/usePullUpReview"
import { Confetti } from "../Confetti"
import { MasteryRing } from "../MasteryRing"
import { OutcomeHeader } from "./OutcomeHeader"
import { RESULT_LOSS, RESULT_WHITE } from "./palette"
import { PlayerMeta } from "./PlayerMeta"
import { ResultActions } from "./ResultActions"
import { ResultDetailsButton } from "./ResultDetailsButton"
import { ScoreBoard } from "./ScoreBoard"
import { StatBoxes } from "./StatBoxes"
import { TrainingNote } from "./TrainingNote"

interface ResultScreenProps {
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  /** Elo figé à l'instant de la partie (snapshot serveur). */
  playerRating: number
  opponentRating: number | null
  playerEloDelta?: number
  playerRated?: boolean
  opponentEloDelta?: number
  opponentRated?: boolean
  scores: { you: number; them: number }
  /** Issue autoritaire (gère le forfait à égalité de score) ; sinon dérivée des scores. */
  outcome?: "win" | "loss" | "draw"
  /** Forfait : `opponent` = l'adversaire a abandonné, `you` = le joueur a abandonné. */
  forfeit?: "you" | "opponent" | null
  topicName: string
  /** Bilan BFF (`reward` arrive après projection) ; `null` tant que la vue n'a pas répondu. */
  result: GameResultView | null
  botGame: boolean
  /** Revanche : crée un défi nominatif vers l'adversaire (flux défi existant). */
  onChallengeRematch: () => void
  rematchPending: boolean
  /** Secondes restantes de la demande de revanche (0 = pas encore connue). */
  rematchRemainingSeconds?: number
  /** Défi de revanche refusé/expiré : le bouton reste désactivé et affiche l'issue. */
  rematchRefused?: boolean
  /** Un défi PENDING existe déjà sur ce sujet : le bouton Revanche est grisé. */
  rematchBlocked?: boolean
  /** Adversaire supprimé : la revanche est indisponible. */
  rematchUnavailable?: boolean
  onOpenReview: () => void
  /** Faux si aucune question n'est à revoir (ex. abandon avant tout round) → pas de DETAILS. */
  canReview?: boolean
  /** Panneau de droite (carousel de revue) en desktop ; absent = pile seule centrée
   *  (tactile ou aucune question à revoir). */
  reviewPane?: ReactNode
  onNewOpponent: () => void
  onReplayBot: () => void
  newOpponentPending?: boolean
  replayPending?: boolean
  onExit: () => void
  reportable?: boolean
  reported?: boolean
  onReportOpponent?: () => void
  opponentSuspended?: boolean
}

/**
 * Écran de résultat du duel (maquette sombre Duolingo-like, tient dans le viewport sans
 * scroll) : issue colorée, bilan sportif, anneau de maîtrise, rejeu/revanche et accès à la revue
 * (cf. `result/` pour les blocs — en-tête d'issue, ligne de score, boîtes de bilan, actions).
 * <p>
 * La pile reproduit le rendu mobile à tous les breakpoints (largeur bornée, avatars alignés sur
 * les colonnes de noms) et reste la **colonne gauche** en desktop. Sur desktop, `reviewPane`
 * (carousel de questions) occupe la colonne droite ; en tactile, le chevron DETAILS ouvre la
 * bottom sheet de revue. Sortie par l'icône X en haut à droite.
 */
export function ResultScreen({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  playerRating,
  opponentRating,
  playerEloDelta = 0,
  playerRated = true,
  opponentEloDelta = 0,
  opponentRated = true,
  scores,
  outcome,
  forfeit = null,
  topicName,
  result,
  botGame,
  onChallengeRematch,
  rematchPending,
  rematchRemainingSeconds = 0,
  rematchRefused = false,
  rematchBlocked = false,
  rematchUnavailable = false,
  onOpenReview,
  canReview = true,
  reviewPane,
  onNewOpponent,
  onReplayBot,
  newOpponentPending,
  replayPending,
  onExit,
  reportable = false,
  reported = false,
  onReportOpponent,
  opponentSuspended = false,
}: ResultScreenProps) {
  const { t } = useTranslation()
  const win = outcome ? outcome === "win" : scores.you > scores.them
  const draw = outcome ? outcome === "draw" : scores.you === scores.them

  const titleColor = draw ? RESULT_WHITE : win ? TOKEN.correctAccent : RESULT_LOSS
  const myColor = draw ? RESULT_WHITE : win ? TOKEN.correctAccent : RESULT_LOSS
  const theirColor = draw
    ? RESULT_WHITE
    : win
      ? RESULT_LOSS
      : TOKEN.correctAccent

  const reward = result?.reward ?? null

  // Forfait : l'issue seule (Victoire/Défaite) ne dit pas pourquoi — on explicite qui a quitté
  // la partie (l'adversaire pour le vainqueur, le joueur lui-même pour le forfait).
  const forfeitLabel =
    forfeit === "you"
      ? t("game.result.forfeitYou")
      : forfeit === "opponent"
        ? t("game.result.forfeitOpponent")
        : null

  const showDetails = canReview && !reviewPane
  const { onTouchStart, onTouchEnd } = usePullUpReview({
    enabled: showDetails,
    onPull: onOpenReview,
  })

  return (
    <div
      className="qu-pop qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        paddingTop: "clamp(10px, 2.2dvh, 22px)",
        paddingLeft: "clamp(12px, 4vw, 22px)",
        paddingRight: "clamp(12px, 4vw, 22px)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile : pile bornée et centrée (mêmes proportions qu'un téléphone). Desktop : deux
          colonnes strictement 50/50 (gouttière centrale) — pile aérée à gauche, carousel de
          revue à droite — et contenu étiré pour ne laisser aucun vide ; sans questions à
          revoir (pas de `reviewPane`), la pile reste seule, centrée. */}
      <div
        className={`flex min-h-0 w-full flex-1 flex-col items-center ${
          reviewPane
            ? "desktop:mx-auto desktop:grid desktop:max-w-[1240px] desktop:grid-cols-2 desktop:items-stretch desktop:gap-x-12 desktop:gap-y-8 desktop:px-4"
            : "desktop:mx-auto desktop:max-w-[520px]"
        }`}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[520px] flex-1 flex-col items-center desktop:max-w-[560px]">
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-around">
            {win && <Confetti />}

            <CloseButton
              onClick={onExit}
              aria-label={t("game.result.quitAria")}
              className="absolute z-40"
              style={{
                top: "calc(env(safe-area-inset-top) + clamp(4px, 1dvh, 10px))",
                right: "clamp(8px, 2.5vw, 16px)",
              }}
            />

            <OutcomeHeader
              win={win}
              draw={draw}
              titleColor={titleColor}
              topicName={topicName}
              forfeitLabel={forfeitLabel}
            />

            <ScoreBoard
              playerName={playerName}
              opponentName={opponentName}
              playerAvatar={playerAvatar}
              opponentAvatar={opponentAvatar}
              playerColor={myColor}
              opponentColor={theirColor}
              scores={scores}
            />

            <div
              className="grid w-full items-start"
              style={{
                gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                columnGap: "clamp(6px, 2vw, 14px)",
              }}
            >
              <PlayerMeta
                name={playerName}
                rating={playerRating}
                ratingDelta={playerEloDelta}
                rated={playerRated}
                color={myColor}
              />
              <span
                className="text-center"
                style={{
                  color: TOKEN.duelSurfaceMuted,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {t("game.result.vs")}
              </span>
              <PlayerMeta
                name={opponentName}
                rating={opponentRating}
                ratingDelta={opponentEloDelta}
                rated={opponentRated}
                color={theirColor}
                suspended={opponentSuspended}
              />
            </div>

            <StatBoxes
              result={result}
              reward={reward}
              yourScore={scores.you}
              training={botGame}
            />

            <div className="flex min-h-0 w-full justify-center">
              {/* Entraînement : aucune XP → l'anneau de maîtrise (qui matérialise un gain)
                laisse place à une note explicite. */}
              {botGame ? (
                <TrainingNote />
              ) : (
                <MasteryRing
                  tier={result?.topicMastery?.tier ?? "FER"}
                  nextTier={result?.topicMastery?.nextTier ?? null}
                  tierRemainingXp={result?.topicMastery?.tierRemainingXp ?? 0}
                  xpGained={reward?.xp ?? null}
                />
              )}
            </div>

            <ResultActions
              botGame={botGame}
              onReplayBot={onReplayBot}
              onChallengeRematch={onChallengeRematch}
              onNewOpponent={onNewOpponent}
              replayPending={replayPending}
              rematchPending={rematchPending}
              rematchRemainingSeconds={rematchRemainingSeconds}
              rematchRefused={rematchRefused}
              rematchBlocked={rematchBlocked}
              rematchUnavailable={rematchUnavailable}
              newOpponentPending={newOpponentPending}
              reportable={reportable}
              reported={reported}
              onReportOpponent={onReportOpponent}
            />
          </div>
        </div>

        {reviewPane && (
          <div className="hidden min-h-0 w-full desktop:flex">{reviewPane}</div>
        )}
      </div>

      {/* Hors du contenu paddé : DETAILS est réellement collé au bas de l'écran (seule la
          safe-area reste dessous). Le contenu résultat au-dessus est le ressort `flex-1`. */}
      <div className="mx-auto flex w-full max-w-[520px] shrink-0 justify-center desktop:max-w-[560px]">
        <ResultDetailsButton
          showDetails={showDetails}
          onOpenReview={onOpenReview}
        />
      </div>
    </div>
  )
}
