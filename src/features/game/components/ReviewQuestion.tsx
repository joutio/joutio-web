import { useTranslation } from "react-i18next"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { useReviewQuestion } from "../hooks/useReviewQuestion"
import type { ReviewRound } from "../domain/review"
import { MatchHeader } from "./MatchHeader"
import { QuestionBody } from "./QuestionBody"
import { ScoreGauge } from "./ScoreGauge"

interface ReviewQuestionProps {
  review: ReviewRound
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
}

/**
 * Replay **exact** d'une manche de duel, figé en phase `reveal` : même `MatchHeader`, mêmes
 * jauges et même `QuestionBody`, chrono et scores arrêtés. Une seule source de rendu pour les
 * slides du carousel de revue (bottom sheet tactile et colonne droite desktop).
 */
export function ReviewQuestion({
  review,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
}: ReviewQuestionProps) {
  const { t } = useTranslation()
  const view = useReviewQuestion({ review, userId, opponentId, language })

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        padding: "clamp(8px, 1.6dvh, 14px) clamp(12px, 4vw, 22px)",
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
        style={{ border: `1px solid ${TOKEN.border}` }}
      >
        <MatchHeader
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          scores={review.scoresAfter}
          scoreStates={view.gauge}
          timeLeft={view.timeLeft}
          gain={null}
          round={review.index}
          firstAnswerPct={view.firstAnswerPct}
          instant
          playerNote={view.playerNote}
          opponentNote={view.opponentNote}
          playerFirst={view.first?.playerId === userId}
          opponentFirst={
            opponentId != null && view.first?.playerId === opponentId
          }
        />
        <div
          className="flex flex-1"
          style={{
            minHeight: 0,
            overflow: "hidden",
            paddingTop: "clamp(4px, 1.2dvh, 8px)",
            paddingBottom: "clamp(8px, 3dvh, 26px)",
          }}
        >
          <ScoreGauge
            score={review.scoresAfter.you}
            state={view.gauge.you}
            side="left"
            label={t("game.arena.scoreOf", { name: playerName })}
            instant
          />
          {view.answers.length > 0 && view.questionText ? (
            <QuestionBody
              key={review.index}
              questionText={view.questionText}
              imageUrl={review.round.imageUrl}
              answers={view.answers}
              phase="reveal"
              yourPick={view.yourPick}
              theirPick={view.theirPick}
              correctAnswer={view.correctAnswer}
              yourCorrect={view.yourCorrect}
              inputEnabled={false}
              onAnswer={() => undefined}
              round={review.index}
              instant
              answersLayout="auto"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
                {t("common.app.loading")}
              </p>
            </div>
          )}
          <ScoreGauge
            score={review.scoresAfter.them}
            state={view.gauge.them}
            side="right"
            label={t("game.arena.scoreOf", { name: opponentName })}
            instant
          />
        </div>
      </div>
    </div>
  )
}
