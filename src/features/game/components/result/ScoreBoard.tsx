import { Zap } from "lucide-react"
import { AnimatedNumber } from "@/shared/components/animated-number"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { RungedAvatar } from "./RungedAvatar"

interface ScoreBoardProps {
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  playerColor: string
  opponentColor: string
  scores: { you: number; them: number }
}

/**
 * Ligne de score de la maquette : avatar — score ⚡ score — avatar (avatars aux extrémités,
 * alignés sur les colonnes de noms justes en dessous).
 */
export function ScoreBoard({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  playerColor,
  opponentColor,
  scores,
}: ScoreBoardProps) {
  return (
    <div
      className="flex w-full min-w-0 items-center justify-center"
      style={{ gap: "clamp(6px, 1.8vw, 14px)" }}
    >
      <RungedAvatar
        name={playerName}
        avatar={playerAvatar}
        ringColor={playerColor}
      />
      <div className="flex min-w-0 flex-1 items-center justify-end">
        <span
          className="truncate"
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: "clamp(26px, 5.5dvh, 42px)",
            fontWeight: 800,
            color: playerColor,
            lineHeight: 1,
          }}
        >
          <AnimatedNumber value={scores.you} />
        </span>
      </div>
      <Zap
        size={22}
        fill={TOKEN.duelSurfaceMuted}
        color={TOKEN.duelSurfaceMuted}
        strokeWidth={0}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-1 items-center justify-start">
        <span
          className="truncate"
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: "clamp(26px, 5.5dvh, 42px)",
            fontWeight: 800,
            color: opponentColor,
            lineHeight: 1,
          }}
        >
          <AnimatedNumber value={scores.them} />
        </span>
      </div>
      <RungedAvatar
        name={opponentName}
        avatar={opponentAvatar}
        ringColor={opponentColor}
      />
    </div>
  )
}
