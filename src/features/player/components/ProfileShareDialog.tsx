import { useTranslation } from "react-i18next"
import { ShareDialog } from "@/shared/components/share-dialog"
import { profileShareMessage } from "../domain/share"

interface ProfileShareDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  name: string
}

/**
 * Partage social de son profil : QR, réseaux (WhatsApp / X / Facebook / Telegram), partage natif
 * et copie du lien public `/players/{userId}`. Dialog sur desktop, bottom sheet en tactile. Un
 * invité sans compte crée le sien puis retombe sur la fiche.
 */
export function ProfileShareDialog({
  open,
  onClose,
  userId,
  name,
}: ProfileShareDialogProps) {
  const { t } = useTranslation()
  return (
    <ShareDialog
      open={open}
      onClose={onClose}
      title={t("player.share.title")}
      sub={t("player.share.sub")}
      text={profileShareMessage(t, name)}
      url={`${window.location.origin}/players/${userId}`}
    />
  )
}
