import { TOKEN, veil } from "@/shared/theme/tokens"
import { RESULT_WHITE } from "./palette"

interface StatBoxProps {
  label: string
  value: string
  color: string
  hint?: string
}

/** Boîte de statistique du bilan (Score du match, bonus, XP totale). */
export function StatBox({ label, value, color, hint }: StatBoxProps) {
  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center rounded-xl border text-center"
      style={{
        borderColor: color,
        background: veil(TOKEN.duelSurface, 3),
        padding: "clamp(3px, 0.7dvh, 7px) clamp(2px, 0.7vw, 6px)",
        minHeight: "clamp(38px, 6.2dvh, 58px)",
      }}
    >
      <span
        style={{
          color,
          fontSize: "clamp(7px, 1.05dvh, 9.5px)",
          fontWeight: 800,
          letterSpacing: "0.08em",
          lineHeight: 1.15,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: "clamp(15px, 2.9dvh, 24px)",
          fontWeight: 800,
          color: RESULT_WHITE,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {hint && (
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(6.5px, 0.9dvh, 9px)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
