import { useTranslation } from "react-i18next"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { clamp } from "@/lib/helpers"
import { TOKEN } from "@/shared/theme/tokens"
import { ROUND_SECONDS } from "../domain/game-constants"
import { MatchPlayerScore } from "./MatchPlayerScore"
import { MatchTimerBar } from "./MatchTimerBar"
import type { GaugeState } from "./ScoreGauge"

interface MatchHeaderProps {
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  scores: { you: number; them: number }
  /** État (correct/erreur) de chaque score, pour colorer le compteur comme les jauges. */
  scoreStates?: { you: GaugeState; them: GaugeState }
  timeLeft: number
  gain: { you: number; them: number } | null
  round: number
  firstAnswerPct: number | null
  /** État figé (revue) : scores et chrono posés sans animation. */
  instant?: boolean
  /** Temps de réponse (revue) affiché sous le score de chaque joueur. */
  playerNote?: string
  opponentNote?: string
  /** Joueur le plus rapide de la manche (mis en avant sous son avatar). */
  playerFirst?: boolean
  opponentFirst?: boolean
}

/** En-tête de l'arène : barre de temps et scores des deux joueurs. */
export function MatchHeader({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  scores,
  scoreStates,
  timeLeft,
  gain,
  round,
  firstAnswerPct,
  instant = false,
  playerNote,
  opponentNote,
  playerFirst = false,
  opponentFirst = false,
}: MatchHeaderProps) {
  const { t } = useTranslation()
  const pct = clamp((timeLeft / ROUND_SECONDS) * 100, 0, 100)
  const frozenWidth =
    firstAnswerPct != null ? Math.max(0, firstAnswerPct - pct) : 0
  const numeric = {
    fontFamily: TOKEN.fontDisplay,
    fontWeight: 700,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  } as const

  return (
    <div style={{ background: TOKEN.duelBg }}>
      <MatchTimerBar pct={pct} frozenWidth={frozenWidth} />

      <div
        className="mx-auto grid w-full max-w-(--duel-stage-w) items-center"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          columnGap: "clamp(8px, 2vw, 16px)",
          padding: "clamp(6px, 1.6dvh, 10px) clamp(12px, 4vw, 22px)",
        }}
      >
        <MatchPlayerScore
          side="left"
          name={playerName}
          avatar={playerAvatar}
          score={scores.you}
          state={scoreStates?.you ?? "idle"}
          note={playerNote}
          first={playerFirst}
          gain={gain?.you}
          round={round}
          instant={instant}
        />

        <div className="text-center whitespace-nowrap">
          <div
            style={{
              color: TOKEN.timer,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
            }}
          >
            {t("game.arena.timeLeft")}
          </div>
          <div
            role="timer"
            aria-live="off"
            aria-label={t("game.arena.timeLeftAria", {
              seconds: Math.ceil(timeLeft),
            })}
            style={{
              ...numeric,
              fontSize: "clamp(16px, 2.9dvh, 24px)",
              color: timeLeft <= 3 ? TOKEN.timerUrgent : TOKEN.timer,
            }}
          >
            {Math.ceil(timeLeft)}
          </div>
        </div>

        <MatchPlayerScore
          side="right"
          name={opponentName}
          avatar={opponentAvatar}
          score={scores.them}
          state={scoreStates?.them ?? "idle"}
          note={opponentNote}
          first={opponentFirst}
          round={round}
          instant={instant}
        />
      </div>
    </div>
  )
}
