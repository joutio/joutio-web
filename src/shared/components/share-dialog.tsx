import { QRCodeSVG } from "qrcode.react"
import { AppDialog } from "@/shared/components/app-dialog"
import { ShareActions } from "@/shared/components/share-actions"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  title: string
  sub?: string
  /** Message accompagnant le lien (dépend du contexte : thème, profil…). */
  text: string
  /** URL absolue partagée. */
  url: string
}

/**
 * Modal de partage social responsive : dialog sur desktop, **bottom sheet** en tactile
 * (compact/tablette). Contenu commun : QR du lien + `ShareActions` (réseaux, partage natif,
 * copie).
 */
export function ShareDialog({
  open,
  onClose,
  title,
  sub,
  text,
  url,
}: ShareDialogProps) {
  const isTouch = useIsTouchLayout()

  const content = (
    <div className="flex flex-col items-center">
      <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-lg">
        <QRCodeSVG value={url} size={120} />
      </div>
      <div className="w-full">
        <ShareActions text={text} url={url} />
      </div>
    </div>
  )

  if (isTouch) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
        title={title}
        description={sub}
        detents={SHEET_DETENTS.share}
      >
        {content}
      </BottomSheet>
    )
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      sub={sub}
      className="tablet-up:max-w-md"
    >
      {content}
    </AppDialog>
  )
}
