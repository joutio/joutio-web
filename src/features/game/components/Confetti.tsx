import { useEffect, useState, type CSSProperties } from "react"
import { TOKEN } from "@/shared/theme/tokens"

const COLORS = [
  TOKEN.primary,
  TOKEN.score,
  TOKEN.correctAccent,
  TOKEN.timer,
  TOKEN.wrongAccent,
  "#ffffff",
]

interface ConfettiPiece {
  id: number
  left: number
  w: number
  h: number
  color: string
  delay: number
  duration: number
  dx: number
  rot: number
  round: boolean
}

function makePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const round = Math.random() > 0.6
    const size = 6 + Math.random() * 8
    return {
      id: i,
      left: Math.random() * 100,
      w: round ? size : Math.max(4, size * 0.45),
      h: round ? size : size * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2.2,
      duration: 2.6 + Math.random() * 2.4,
      dx: (Math.random() * 2 - 1) * 150,
      rot: 360 + Math.random() * 900,
      round,
    }
  })
}

interface ConfettiProps {
  count?: number
}

export function Confetti({ count = 90 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const to = setTimeout(() => setPieces(makePieces(count)), 0)
    return () => clearTimeout(to)
  }, [count])

  if (pieces.length === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 30 }}
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="qu-confetti"
          style={
            {
              position: "absolute",
              top: 0,
              left: `${piece.left}%`,
              width: piece.w,
              height: piece.h,
              background: piece.color,
              borderRadius: piece.round ? 999 : 2,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--dx": `${piece.dx}px`,
              "--rot": `${piece.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
