import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"
import { TOKEN } from "@/shared/theme/tokens"

interface ResultDetailsButtonProps {
  /** Chevron actif : des questions sont disponibles pour la revue tactile. */
  showDetails: boolean
  onOpenReview: () => void
}

/**
 * Chevron DETAILS de l'écran de résultat (tactile). Rendu **hors** de la pile distribuée
 * `justify-around` pour rester collé au bas de l'écran ; invisible (mais avec son espace
 * réservé) quand aucune question n'est à revoir, et hors flux desktop où la revue est un
 * carousel.
 */
export function ResultDetailsButton({
  showDetails,
  onOpenReview,
}: ResultDetailsButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      data-slot="result-details"
      onClick={onOpenReview}
      disabled={!showDetails}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1",
        !showDetails && "invisible desktop:hidden"
      )}
      aria-label={t("game.result.openReviewAria")}
      style={{
        paddingTop: "clamp(2px, 0.6dvh, 6px)",
        paddingBottom: 4,
      }}
    >
      <span
        className="qu-bob"
        style={{
          width: 42,
          height: 4,
          borderRadius: 999,
          background: TOKEN.duelSurfaceMuted,
          opacity: 0.5,
        }}
        aria-hidden
      />
      <span
        style={{
          color: TOKEN.duelSurfaceMuted,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.22em",
        }}
      >
        {t("game.result.details")}
      </span>
      <ChevronDown size={18} color={TOKEN.duelSurfaceMuted} />
    </button>
  )
}
