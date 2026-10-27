import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * Bandeau de statistiques — N colonnes séparées par des filets verticaux.
 * Reprend le bloc « VOTRE NIVEAU | ABONNÉS | QUESTIONS » des fiches thème et
 * « PARTIES | ABONNÉS | ABONNÉ À » des profils. Purement présentationnel.
 */
export interface StatStripItem {
  label: string
  value: ReactNode
  sub?: ReactNode
  /** Couleur de la valeur (hex de sujet ou variable CSS). */
  accent?: string
}

interface StatStripProps {
  items: StatStripItem[]
  className?: string
}

export function StatStrip({ items, className }: StatStripProps) {
  return (
    <div
      className={cn("grid", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-2 text-center tablet-up:px-3",
            i > 0 && "border-l border-border"
          )}
        >
          <span className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
            {it.label}
          </span>
          <span
            className="font-heading text-xl leading-tight font-extrabold tabular-nums tablet-up:text-2xl"
            style={it.accent ? { color: it.accent } : undefined}
          >
            {it.value}
          </span>
          {it.sub && (
            <span className="text-xs text-muted-foreground">{it.sub}</span>
          )}
        </div>
      ))}
    </div>
  )
}
