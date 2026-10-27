import type { ReactNode } from "react"
import { TOKEN } from "@/shared/theme/tokens"

/**
 * Statut d'attente : pastille douce (point qui pulse) au lieu d'un texte clignotant.
 * `trailing` complète la pastille (ex. le temps restant) **dans** le même container.
 */
export function WaitingStatusPill({
  label,
  trailing,
}: {
  label: string
  trailing?: ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-semibold"
      style={{
        color: TOKEN.score,
        borderColor: `color-mix(in srgb, ${TOKEN.score} 35%, transparent)`,
        background: `color-mix(in srgb, ${TOKEN.score} 10%, transparent)`,
      }}
    >
      <span
        className="size-1.5 animate-pulse rounded-full"
        style={{ background: TOKEN.score }}
      />
      {label}
      {trailing}
    </span>
  )
}
