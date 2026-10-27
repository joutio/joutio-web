import { useTranslation } from "react-i18next"
import { TOKEN } from "@/shared/theme/tokens"
import type { GameResultView } from "../../domain/game-dto"
import { RESULT_LOSS } from "./palette"
import { StatBox } from "./StatBox"

interface StatBoxesProps {
  /** Bilan BFF (`reward` arrive après projection) ; `null` tant que la vue n'a pas répondu. */
  result: GameResultView | null
  reward: GameResultView["reward"] | null
  /** Score du joueur — repli du score du match tant que le bilan n'est pas arrivé. */
  yourScore: number
  /**
   * Entraînement (duel contre bot) : aucune XP n'est attribuée, les boîtes de récompense
   * (bonus victoire, XP) laissent donc place aux faits du duel (bonnes réponses).
   */
  training?: boolean
}

/** Boîtes du bilan : score du match, bonus rapidité, bonus victoire et XP du sujet. */
export function StatBoxes({
  result,
  reward,
  yourScore,
  training = false,
}: StatBoxesProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`grid w-full ${training ? "grid-cols-3" : "grid-cols-4"}`}
      style={{
        gap: "clamp(4px, 1dvh, 10px)",
      }}
    >
      <StatBox
        label={t("game.result.score")}
        color={TOKEN.gauge}
        value={String(result?.basePoints ?? yourScore)}
      />
      <StatBox
        label={t("game.result.speedBonus")}
        color={TOKEN.correctAccent}
        value={reward == null ? "···" : `+${result?.speedBonus ?? 0}`}
      />
      {training ? (
        <StatBox
          label={t("game.result.correctAnswers")}
          color={TOKEN.timer}
          value={
            result == null
              ? "···"
              : `${result.correctAnswers}/${result.totalRounds}`
          }
        />
      ) : (
        <>
          <StatBox
            label={t("game.result.victoryBonus")}
            color={TOKEN.timer}
            value={reward == null ? "···" : `+${reward.victoryBonus}`}
          />
          <StatBox
            label={t("game.result.xpTopic")}
            color={RESULT_LOSS}
            value={reward == null ? "···" : `${reward.xp}`}
          />
        </>
      )}
    </div>
  )
}
