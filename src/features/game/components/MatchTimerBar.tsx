import { veil, TOKEN } from "@/shared/theme/tokens"

interface MatchTimerBarProps {
  /** Largeur remplie (0–100) : le temps restant. */
  pct: number
  /** Largeur de la zone « gelée » entre le premier répondant et la position courante. */
  frozenWidth: number
}

/** Barre de temps de l'en-tête de match : remplissage courant + zone gelée du premier répondant. */
export function MatchTimerBar({ pct, frozenWidth }: MatchTimerBarProps) {
  return (
    <div
      className="relative h-[5px] overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      {frozenWidth > 0 && (
        <div
          className="absolute inset-y-0"
          style={{
            left: `${pct}%`,
            width: `${frozenWidth}%`,
            background: veil(TOKEN.timer, 45),
          }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background: TOKEN.timer,
          transition: "width .05s linear",
        }}
      />
    </div>
  )
}
