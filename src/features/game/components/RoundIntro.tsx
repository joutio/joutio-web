import { useTranslation } from "react-i18next"
import { TopicIcon } from "@/shared/components/topic-icon"
import { TOKEN, veil } from "@/shared/theme/tokens"
import { ROUNDS } from "../domain/game-constants"

interface RoundIntroProps {
  topicName: string
  topicEmoji?: string
  topicImageUrl?: string
  categoryLabel: string
  categoryColor: string
  round: number
  bonus: boolean
  /** Temps déjà écoulé dans la fenêtre d'annonce serveur : rejoue l'anim à son point exact. */
  elapsedMs?: number
}

export function RoundIntro({
  topicName,
  topicEmoji,
  topicImageUrl,
  categoryLabel,
  categoryColor,
  round,
  bonus,
  elapsedMs = 0,
}: RoundIntroProps) {
  const { t } = useTranslation()
  return (
    <div
      className="qu-pop flex flex-1 flex-col items-center justify-center"
      style={elapsedMs > 0 ? { animationDelay: `-${elapsedMs}ms` } : undefined}
    >
      <TopicIcon
        topic={{
          emoji: topicEmoji ?? "❔",
          color: categoryColor,
          imageUrl: topicImageUrl,
        }}
        size={64}
      />
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 19,
          fontWeight: 600,
          marginTop: 16,
        }}
      >
        {topicName}
      </div>
      <div
        style={{
          color: TOKEN.mutedFg,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          marginTop: 3,
        }}
      >
        {categoryLabel.toUpperCase()}
      </div>

      {bonus && (
        <span
          className="qu-pop"
          style={{
            marginTop: 14,
            padding: "4px 14px",
            borderRadius: 999,
            background: veil(TOKEN.score, 18),
            border: `1px solid ${TOKEN.score}`,
            color: TOKEN.score,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
          }}
        >
          {t("game.arena.bonus")}
        </span>
      )}

      <div
        className="qu-glow"
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginTop: 20,
          lineHeight: 1,
          color: bonus ? TOKEN.score : TOKEN.fg,
        }}
      >
        {t("game.arena.round", { round: round + 1 })}
      </div>
      <div style={{ color: TOKEN.mutedFg, fontSize: 13, marginTop: 8 }}>
        {t("game.arena.roundOf", { current: round + 1, total: ROUNDS })}
      </div>
      <div
        className="qu-flash"
        style={{
          color: TOKEN.score,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.16em",
          marginTop: 14,
        }}
      >
        {t("game.arena.ready")}
      </div>
    </div>
  )
}
