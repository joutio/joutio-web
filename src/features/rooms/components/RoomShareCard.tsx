import { useTranslation } from "react-i18next"
import { ShareNetworkIcon } from "@phosphor-icons/react"
import { QRCodeSVG } from "qrcode.react"
import { ShareActions } from "@/shared/components/share-actions"
import { TOKEN } from "@/shared/theme/tokens"
import { shareMessage } from "../domain/share"

interface RoomShareCardProps {
  shareUrl: string
  topicName?: string
}

/**
 * Partage d'un salon privé, façon réseau social : QR, réseaux (WhatsApp / X / Facebook /
 * Telegram), partage natif si disponible, et copie du lien.
 */
export function RoomShareCard({ shareUrl, topicName }: RoomShareCardProps) {
  const { t } = useTranslation()
  const text = shareMessage(topicName, t)

  return (
    <div
      className="w-full max-w-[380px] rounded-lg border p-5"
      style={{
        background: TOKEN.card,
        borderColor: TOKEN.border,
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShareNetworkIcon size={15} style={{ color: TOKEN.accentInk }} />
        {t("game.share.invite")}
      </div>
      <p className="mt-1 text-xs" style={{ color: TOKEN.mutedFg }}>
        {t("game.share.description")}
      </p>

      <div className="mt-4 grid place-items-center rounded-2xl bg-white p-3">
        <QRCodeSVG value={shareUrl} size={140} />
      </div>

      <ShareActions text={text} url={shareUrl} />
    </div>
  )
}
