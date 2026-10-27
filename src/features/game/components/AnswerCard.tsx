import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { TOKEN } from "@/shared/theme/tokens"

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "muted"

function Notch({ side }: { side: "left" | "right" }) {
  const style: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 17,
    height: 40,
    background: TOKEN.duelBg,
    pointerEvents: "none",
    clipPath:
      side === "left"
        ? "polygon(0 0, 100% 50%, 0 100%)"
        : "polygon(100% 0, 0 50%, 100% 100%)",
  }
  style[side] = 0
  return <span aria-hidden="true" style={style} />
}

const PALETTE: Record<AnswerState, { background: string; color: string }> = {
  idle: { background: TOKEN.duelSurface, color: TOKEN.duelSurfaceFg },
  selected: { background: TOKEN.duelSurfaceMuted, color: TOKEN.duelSurfaceFg },
  correct: { background: TOKEN.correct, color: TOKEN.correctFg },
  wrong: { background: TOKEN.wrong, color: TOKEN.wrongFg },
  muted: {
    background: TOKEN.duelSurfaceMuted,
    color: TOKEN.duelSurfaceMutedFg,
  },
}

interface AnswerCardProps {
  label: string
  state: AnswerState
  notchLeft?: boolean
  notchRight?: boolean
  /** Réponse envoyée en attente de confirmation serveur (écho WS en route). */
  pending?: boolean
  onClick?: () => void
  disabled?: boolean
  /** Variante compacte : grille 2×2 quand la question affiche une image. */
  compact?: boolean
  /** État figé (revue) : pas d'animation de bonne/mauvaise réponse. */
  instant?: boolean
  className?: string
}

export function AnswerCard({
  label,
  state,
  notchLeft,
  notchRight,
  pending,
  onClick,
  disabled,
  compact,
  instant = false,
  className,
}: AnswerCardProps) {
  const palette = PALETTE[state]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={notchLeft}
      aria-busy={pending}
      className={cn(
        "qu-answer relative h-full w-full",
        !instant && pending && "qu-answer-pending",
        !instant && state === "correct" && "qu-correct-pop",
        !instant && state === "wrong" && "qu-shake",
        className
      )}
      style={{
        background: palette.background,
        color: palette.color,
        border: "none",
        height: "100%",
        minHeight: 0,
        borderRadius: 8,
        padding: compact
          ? "0 clamp(6px, 2vw, 14px)"
          : "0 clamp(10px, 2.6vw, 26px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: TOKEN.fontSans,
        fontSize: compact
          ? "clamp(12px, 1.8dvh, 20px)"
          : "clamp(13px, 2.2dvh, 24px)",
        fontWeight: 600,
        lineHeight: 1.15,
        textAlign: "center",
        overflow: "hidden",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
      {notchLeft && <Notch side="left" />}
      {notchRight && <Notch side="right" />}
    </button>
  )
}
