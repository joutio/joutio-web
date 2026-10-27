import type { CSSProperties, ReactNode } from "react"
import { cn } from "cn"
import { CARD_INTERACTIVE_CLASS } from "@/components/ui/card"

interface SelectRowProps {
  /** Visuel de tête (avatar joueur, pastille de thème, icône de sujet…). */
  visual: ReactNode
  title: string
  subtitle?: ReactNode
  /** État sélectionné (uniquement si `onSelect` est fourni). */
  selected?: boolean
  /** Fourni ⇒ ligne interactive (bouton + radio) ; absent ⇒ rappel statique. */
  onSelect?: () => void
  className?: string
}

/**
 * Ligne de sélection neutre **partagée** par toutes les listes de choix de l'app (parcours de
 * défi — sélection d'un joueur ou d'un thème — et choix du titre porté) et les rappels : visuel,
 * titre, sous-titre et radio optionnelle. **Style shadcn compact** (`rounded-lg`, `p-2.5`) :
 * ces listes restent des lignes denses et ne suivent pas la recette des cartes (`rounded-card`).
 */
export function SelectRow({
  visual,
  title,
  subtitle,
  selected = false,
  onSelect,
  className,
}: SelectRowProps) {
  const interactive = Boolean(onSelect)
  const active = interactive && selected

  const style: CSSProperties | undefined = active
    ? {
        borderColor: "var(--primary)",
        background: "color-mix(in srgb, var(--primary) 8%, var(--card))",
      }
    : undefined

  const content = (
    <>
      {visual}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
      {interactive && (
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full border-2"
          style={{
            borderColor: active ? "var(--primary)" : "var(--border)",
            background: active ? "var(--primary)" : "transparent",
          }}
        />
      )}
    </>
  )

  const classes = cn(
    "flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left transition-colors",
    interactive && CARD_INTERACTIVE_CLASS,
    className
  )

  if (!interactive) {
    return (
      <div className={classes} style={style}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={classes}
      style={style}
    >
      {content}
    </button>
  )
}
