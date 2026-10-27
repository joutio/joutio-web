import type { ReactNode } from "react"
import { TOKEN } from "@/shared/theme/tokens"
import { RESULT_WHITE } from "./palette"

interface ActionButtonProps {
  icon: ReactNode
  children: ReactNode
  background: string
  disabled?: boolean
  onClick: () => void
  /** Nom accessible quand le libellé visible est trop générique (ex. « Signaler »). */
  ariaLabel?: string
}

/** Bouton d'action de l'écran de résultat (height/rayon/police de la maquette). */
export function ActionButton({
  icon,
  children,
  background,
  disabled,
  onClick,
  ariaLabel,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="qu-btn flex w-full min-w-0 items-center justify-center gap-2 rounded-[14px] font-bold whitespace-nowrap disabled:opacity-50"
      style={{
        height: "clamp(42px, 6.2dvh, 54px)",
        background,
        color: RESULT_WHITE,
        fontFamily: TOKEN.fontDisplay,
        fontSize: "clamp(13px, 2dvh, 16px)",
      }}
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}
