import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShareDialog } from "@/shared/components/share-dialog"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { shareMessage } from "../domain/share"
import { RoomShareCard } from "./RoomShareCard"

interface RoomInviteProps {
  shareUrl: string
  topicName?: string
}

/**
 * Invitation d'un salon privé : carte inline (lien + QR) sur grand écran, **bottom sheet** en
 * tactile — le contenu de partage ne s'ouvre que via le bouton « Inviter un adversaire »
 * (jamais automatiquement à l'arrivée dans le salon).
 */
export function RoomInvite({ shareUrl, topicName }: RoomInviteProps) {
  const { t } = useTranslation()
  const isTouch = useIsTouchLayout()
  const [open, setOpen] = useState(false)

  if (!isTouch) {
    return <RoomShareCard shareUrl={shareUrl} topicName={topicName} />
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-[380px]"
        onClick={() => setOpen(true)}
      >
        <Share2 size={15} /> {t("game.share.invite")}
      </Button>
      <ShareDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("game.share.invite")}
        sub={t("game.share.description")}
        text={shareMessage(topicName, t)}
        url={shareUrl}
      />
    </>
  )
}
