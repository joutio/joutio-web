import { useTranslation } from "react-i18next"
import { AnimatedNumber } from "@/shared/components/animated-number"
import {
  UserAvatar,
  type AvatarIdentity,
} from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { SCORE_REVEAL_MS } from "../domain/game-constants"
import type { GaugeState } from "./ScoreGauge"

/** Couleur du score, identique à celle des jauges latérales. */
function scoreColor(state: GaugeState): string {
  if (state === "correct") return TOKEN.correctAccent
  if (state === "wrong") return TOKEN.wrongAccent
  return TOKEN.gauge
}

interface MatchPlayerScoreProps {
  /** Côté du joueur dans l'en-tête (gauche = joueur courant, droite = adversaire). */
  side: "left" | "right"
  name: string
  avatar?: AvatarIdentity
  score: number
  state: GaugeState
  /** Temps de réponse affiché sous le score (revue). */
  note?: string
  /** Joueur le plus rapide de la manche (repère « premier à répondre »). */
  first?: boolean
  /** Points gagnés à la manche (badge animé — joueur courant uniquement). */
  gain?: number
  round: number
  /** État figé (revue) : score posé sans animation. */
  instant: boolean
}

/** Bloc score d'un joueur de l'en-tête de match (avatar, pseudo, score, note de revue). */
export function MatchPlayerScore({
  side,
  name,
  avatar,
  score,
  state,
  note,
  first = false,
  gain,
  round,
  instant,
}: MatchPlayerScoreProps) {
  const { t } = useTranslation()
  const reversed = side === "right"
  const numeric = {
    fontFamily: TOKEN.fontDisplay,
    fontWeight: 700,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  } as const

  const info = (
    <div
      className={reversed ? "min-w-0" : "relative min-w-0 flex-1"}
      style={
        reversed ? { marginRight: 12, textAlign: "right" } : { marginLeft: 12 }
      }
    >
      <div className="truncate" style={{ fontSize: 13.5, fontWeight: 600 }}>
        {name}
      </div>
      <div
        data-slot={reversed ? "score-them" : "score-you"}
        style={{
          ...numeric,
          fontSize: "clamp(16px, 2.8dvh, 22px)",
          color: scoreColor(state),
        }}
      >
        {instant ? (
          score
        ) : (
          <AnimatedNumber value={score} duration={SCORE_REVEAL_MS} />
        )}
      </div>
      {note && (
        <div
          data-slot={reversed ? "time-them" : "time-you"}
          style={{
            ...numeric,
            marginTop: 1,
            fontSize: 11,
            lineHeight: 1.2,
            color: first ? TOKEN.timer : TOKEN.duelSurfaceMuted,
          }}
        >
          {first ? `${t("game.arena.first")} · ${note}` : note}
        </div>
      )}
      {gain != null && gain > 0 && (
        <div
          key={`gain-${round}`}
          style={{
            position: "absolute",
            left: 46,
            top: 18,
            color: TOKEN.correctAccent,
            ...numeric,
            fontSize: 15,
            animation: "qu-rise 1.4s ease-out forwards",
          }}
        >
          +{gain}
        </div>
      )}
    </div>
  )

  const avatarElement = (
    <UserAvatar
      name={name}
      userId={avatar?.userId}
      avatarOptions={avatar?.avatarOptions}
      initialOnly={avatar?.initialOnly}
      size={40}
    />
  )

  return (
    <div
      className={
        reversed
          ? "flex min-w-0 items-center justify-end"
          : "flex min-w-0 items-center"
      }
    >
      {reversed ? (
        <>
          {info}
          {avatarElement}
        </>
      ) : (
        <>
          {avatarElement}
          {info}
        </>
      )}
    </div>
  )
}
