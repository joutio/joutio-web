import { useTranslation } from "react-i18next"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { categoryColor, categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import type { DuelArena } from "../hooks/useDuelArena"
import { MatchHeader } from "./MatchHeader"
import { QuestionBody } from "./QuestionBody"
import { RoundIntro } from "./RoundIntro"
import { ScoreGauge } from "./ScoreGauge"

interface DuelArenaViewProps {
  /** View model de la scène courante (`useDuelArena`). */
  arena: DuelArena
  playerName: string
  opponentName: string
  playerAvatar: AvatarIdentity
  opponentAvatar: AvatarIdentity
  topic: TopicCard | undefined
  topicName: string
}

/**
 * Composition de l'arène : en-tête de match (scores, chrono, bonus), jauges latérales et zone
 * centrale (intro de tour ou question). Toute la dynamique vient du view model `arena`.
 */
export function DuelArenaView({
  arena,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  topic,
  topicName,
}: DuelArenaViewProps) {
  const { t } = useTranslation()
  const { scene } = arena

  return (
    <div
      className="qu-immersive-safe flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <MatchHeader
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        scores={{ you: arena.myScore, them: arena.theirScore }}
        scoreStates={arena.gauge}
        timeLeft={arena.timeLeftDisplay}
        gain={arena.gain}
        round={arena.roundIndex}
        firstAnswerPct={arena.firstAnswerPctValue}
      />
      <div
        className="flex w-full flex-1"
        style={{
          minHeight: 0,
          overflow: "hidden",
          paddingTop: "clamp(4px, 1.2dvh, 8px)",
          paddingBottom: "clamp(8px, 3dvh, 26px)",
        }}
      >
        <ScoreGauge
          score={arena.myScore}
          state={arena.gauge.you}
          side="left"
          label={t("game.arena.scoreOf", { name: playerName })}
        />
        {/* Composition bornée à `--duel-stage-w` et centrée : sur desktop les jauges courent
            jusqu'aux bords du cadre (comme en mobile) au lieu d'être ramenées par le contenu. */}
        <div className="mx-auto flex min-h-0 max-w-(--duel-stage-w) min-w-0 flex-1 flex-col">
          {scene.kind === "roundIntro" ? (
            <RoundIntro
              topicName={topicName}
              topicEmoji={topic?.emoji ?? undefined}
              topicImageUrl={topic?.imageUrl ?? undefined}
              categoryLabel={
                topic
                  ? categoryLabel(
                      topic.category ?? "",
                      topic.categoryLabel ?? undefined
                    )
                  : ""
              }
              categoryColor={
                topic ? categoryColor(topic.category ?? "") : TOKEN.primary
              }
              round={scene.round}
              bonus={scene.bonus}
              elapsedMs={scene.elapsedMs}
            />
          ) : arena.answers.length > 0 && arena.questionText ? (
            <QuestionBody
              key={arena.roundIndex}
              questionText={arena.questionText}
              imageUrl={arena.imageUrl}
              answers={arena.answers}
              phase={scene.kind === "reveal" ? "reveal" : "question"}
              yourPick={arena.yourPick}
              theirPick={arena.theirPick}
              correctAnswer={arena.correctAnswer}
              yourCorrect={arena.yourCorrect}
              pendingChoice={arena.pendingChoice}
              inputEnabled={arena.isAnswerable}
              onAnswer={arena.handleAnswer}
              round={arena.roundIndex}
              instant={arena.joinedLate}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("common.app.loading")}
              </p>
            </div>
          )}
        </div>
        <ScoreGauge
          score={arena.theirScore}
          state={arena.gauge.them}
          side="right"
          label={t("game.arena.scoreOf", { name: opponentName })}
        />
      </div>
    </div>
  )
}
