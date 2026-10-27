import type { CSSProperties } from "react"
import { TOKEN } from "@/shared/theme/tokens"

interface NamePlateProps {
  name: string
  accent: string
  side: "top" | "bottom"
}

/** Pseudo en filigrane (contour typographique) d'un camp de l'écran VS. */
export function NamePlate({ name, accent, side }: NamePlateProps) {
  const label = name.split("·")[0].trim()
  const style: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    fontFamily: TOKEN.fontDisplay,
    fontWeight: 900,
    fontStyle: "italic",
    fontSize: "clamp(40px, 7vw, 86px)",
    letterSpacing: "-0.045em",
    lineHeight: 0.85,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: "transparent",
    WebkitTextStroke: `2px ${accent}`,
    opacity: 0.4,
    pointerEvents: "none",
    userSelect: "none",
  }
  style[side === "top" ? "left" : "right"] = "34%"
  return (
    <span aria-hidden style={style}>
      {label}
    </span>
  )
}
