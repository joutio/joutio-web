import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * En-tête de section de l'Accueil — titre + action « Tout voir » / « Explorer le catalogue ».
 * L'action reste visible en compact avec un libellé réduit (`compactActionLabel`) pour tenir
 * sur une seule ligne avec le titre.
 */
interface SectionHeaderProps {
  title: string
  actionLabel?: string
  /** Libellé plus court affiché sous le breakpoint compact. */
  compactActionLabel?: string
  onAction?: () => void
  /** Remplace l'action par défaut (ex. un `<Select>`). */
  children?: ReactNode
}

export function SectionHeader({
  title,
  actionLabel,
  compactActionLabel,
  onAction,
  children,
}: SectionHeaderProps) {
  const { t } = useTranslation()
  const label = actionLabel ?? t("home.sectionHeader.seeAll")
  const action =
    children ??
    (onAction ? (
      <Button variant="ghost" size="sm" aria-label={label} onClick={onAction}>
        {compactActionLabel ? (
          <>
            <span className="compact:hidden">{label}</span>
            <span className="hidden compact:inline">{compactActionLabel}</span>
          </>
        ) : (
          label
        )}
        <ChevronRight />
      </Button>
    ) : null)

  return (
    <div className="mb-3 flex items-center justify-between gap-3 compact:mb-2">
      <h2 className="min-w-0 font-heading text-xl leading-tight font-bold">
        {title}
      </h2>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  )
}
