import { forwardRef } from "react"
import type { ButtonHTMLAttributes } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label"?: string
}

/**
 * Bouton de fermeture canonique des modales / bottom sheets : cercle bordé sur fond
 * `--surface-muted`, taille `--control-h-sm` (32 px desktop / 44 px tactile), icône 16 px.
 * Référence visuelle : `.close` du bottom sheet Arc. Utilisable en `render=` (Base UI) ou
 * `asChild` (Radix) grâce au `forwardRef` et au socle `<button>` neutre.
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton({ className, "aria-label": ariaLabel, ...props }, ref) {
    const { t } = useTranslation()
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel ?? t("shared.actions.close")}
        className={cn(
          "grid size-(--control-h-sm) shrink-0 place-items-center rounded-full border border-border bg-[var(--surface-muted)] p-0 text-[var(--text-secondary)] transition-colors",
          "hover:border-[var(--border-strong)] hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className
        )}
        {...props}
      >
        <X className="size-4" aria-hidden />
      </button>
    )
  }
)
