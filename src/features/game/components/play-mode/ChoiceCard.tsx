import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CARD_INTERACTIVE_CLASS } from "@/components/ui/card"

interface ChoiceCardProps {
  icon: LucideIcon
  title: string
  desc: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

/**
 * Carte de choix radio (adversaire, source de recherche, difficulté) — **style shadcn compact**
 * (`rounded-lg border p-3`) : icône de tête, titre, description et radio. Comme les lignes de
 * sélection (`SelectRow`), elle ne suit pas la recette des cartes (`rounded-card`).
 */
export function ChoiceCard({
  icon: Icon,
  title,
  desc,
  selected,
  onSelect,
  disabled = false,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left",
        !disabled && CARD_INTERACTIVE_CLASS,
        disabled && "cursor-not-allowed opacity-50"
      )}
      style={
        selected
          ? {
              borderColor: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 8%, var(--card))",
            }
          : undefined
      }
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
        color={selected ? "var(--primary)" : "var(--muted-foreground)"}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {desc}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-0.5 size-4 shrink-0 rounded-full border-2"
        style={{
          borderColor: selected ? "var(--primary)" : "var(--border)",
          background: selected ? "var(--primary)" : "transparent",
        }}
      />
    </button>
  )
}
