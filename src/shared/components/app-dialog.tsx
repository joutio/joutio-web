import type { ReactNode } from "react"
import { cn } from "cn"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"

/**
 * Dialog applicatif — enveloppe le `Dialog` shadcn natif (titre / description / footer).
 * L'en-tête et les actions restent toujours visibles : seul le corps défile.
 * Avec `sheetOnTouch`, il devient une **bottom sheet Arc** en tactile (mobile/tablette),
 * le dialog centré restant la voie desktop.
 */
interface AppDialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Sous-titre de l'en-tête — **nœud libre** pour les mots teintés (ex. palier d'un badge). */
  sub?: ReactNode
  /** Barre fixe (recherche, filtres…) entre l'en-tête et le corps scrollable. */
  toolbar?: ReactNode
  children: ReactNode
  /**
   * Barre fixe épinglée **sous** le corps scrollable, sur sa **propre ligne juste au-dessus
   * des actions** (recherche mobile) — jamais fusionnée avec la rangée de boutons.
   */
  bottomBar?: ReactNode
  footer?: ReactNode
  className?: string
  /** Classes additionnelles du corps scrollable (ex. `flex flex-col`). */
  bodyClassName?: string
  /**
   * Classes additionnelles du footer. En bottom sheet, le footer est une colonne inversée :
   * le **dernier** bouton (confirmation) apparaît au-dessus, l'annulation en dessous.
   */
  footerClassName?: string
  showCloseButton?: boolean
  /**
   * `false` : la modale centrée ne peut pas être fermée par clic extérieur / Échap
   * (réponse obligatoire). Sans effet sur la variante bottom sheet `sheetOnTouch`.
   */
  dismissible?: boolean
  /** En tactile : rend une bottom sheet Arc au lieu de la modale centrée. */
  sheetOnTouch?: boolean
  /** Detents de la bottom sheet (défaut : confirmation courte). */
  sheetDetents?: number[]
  /** z-index du sheet tactile ; la feuille est rendue à `layer + 1`. Défaut : 50. */
  sheetLayer?: number
}

export function AppDialog({
  open,
  onClose,
  title,
  sub,
  toolbar,
  children,
  bottomBar,
  footer,
  className,
  bodyClassName,
  footerClassName,
  showCloseButton = true,
  dismissible = true,
  sheetOnTouch = false,
  sheetDetents = SHEET_DETENTS.confirm,
  sheetLayer = 50,
}: AppDialogProps) {
  const isTouch = useIsTouchLayout()

  if (sheetOnTouch && isTouch) {
    // Un seul detent (le plus haut) : la feuille ne peut pas se réduire, sinon son footer
    // d'actions descendrait sous le viewport et disparaîtrait.
    const detents = [
      sheetDetents.length
        ? Math.max(...sheetDetents)
        : SHEET_DETENTS.confirm[0],
    ]
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
        title={title}
        description={sub}
        detents={detents}
        initialDetent={0}
        layer={sheetLayer}
        hideClose={!showCloseButton}
        toolbar={toolbar}
        footer={
          footer || bottomBar ? (
            <div className="flex flex-col gap-3">
              {/* La recherche garde sa propre ligne : seule la rangée d'actions
                                passe en `flex-row` en compact. */}
              {bottomBar}
              {footer ? (
                <div
                  className={cn("flex flex-col-reverse gap-2", footerClassName)}
                >
                  {footer}
                </div>
              ) : undefined}
            </div>
          ) : undefined
        }
      >
        <div className={bodyClassName}>{children}</div>
      </BottomSheet>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      disablePointerDismissal={!dismissible}
    >
      <DialogContent
        className={cn(
          "flex max-h-[min(85dvh,var(--vvh,100dvh))] flex-col gap-0 overflow-hidden p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader
          className={cn(
            "shrink-0 gap-1.5 border-b px-6 py-4 pr-14",
            showCloseButton && "compact:min-h-16 compact:pr-16"
          )}
        >
          <DialogTitle>{title}</DialogTitle>
          {sub && <DialogDescription>{sub}</DialogDescription>}
        </DialogHeader>
        {toolbar && (
          <div className="shrink-0 border-b bg-popover px-6 py-3">
            {toolbar}
          </div>
        )}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5",
            bodyClassName
          )}
        >
          {children}
        </div>
        {bottomBar && (
          <div className="shrink-0 border-t bg-popover px-6 py-3">
            {bottomBar}
          </div>
        )}
        {footer && (
          <DialogFooter
            className={cn(
              "shrink-0 border-t bg-popover px-6 py-4",
              footerClassName
            )}
          >
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
