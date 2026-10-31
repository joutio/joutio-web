import { CheckIcon } from "@phosphor-icons/react"
import { cn } from "cn"
import { CARD_INTERACTIVE_CLASS } from "@/components/ui/card"

interface SelectableTileProps {
  title: string
  hint?: string
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  className?: string
}

/**
 * Tuile de choix multi-sélection (motifs de signalement) : reprend l'état sélectionné des
 * tuiles d'onboarding — cadre et ring primaires, fond teinté et coche pleine — pour que le
 * choix courant reste immédiatement lisible. La disposition verticale titre + description est
 * conservée ; l'emplacement de la coche est réservé même à l'état repos pour éviter tout
 * décalage au clic.
 */
export function SelectableTile({
  title,
  hint,
  selected,
  onSelectedChange,
  className,
}: SelectableTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelectedChange(!selected)}
      className={cn(
        "flex min-h-(--control-h-md) w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : cn("border-border bg-card", CARD_INTERACTIVE_CLASS),
        className
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          selected ? "bg-primary text-primary-foreground" : "text-transparent"
        )}
      >
        <CheckIcon className="size-3" />
      </span>
    </button>
  )
}
