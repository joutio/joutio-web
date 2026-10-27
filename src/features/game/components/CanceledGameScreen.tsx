import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { TOKEN } from "@/shared/theme/tokens"

interface CanceledGameScreenProps {
  /** Raison serveur (`NO_SHOW_START`, `GAME_EXPIRED`, …) — libellé générique sinon. */
  canceledReason: string | null
  /** Adversaire humain : l'action secondaire propose un nouvel adversaire plutôt que « Rejouer ». */
  humanOpponent: boolean
  replayPending: boolean
  onBackToTopic: () => void
  onReplay: () => void
}

/**
 * Partie annulée (no-show, expirée) : pas d'issue sportive — écran dédié plutôt qu'un faux
 * « Égalité 0-0 ».
 */
export function CanceledGameScreen({
  canceledReason,
  humanOpponent,
  replayPending,
  onBackToTopic,
  onReplay,
}: CanceledGameScreenProps) {
  const { t } = useTranslation()

  const title =
    canceledReason === "NO_SHOW_START"
      ? t("game.arena.canceled.noShow")
      : canceledReason === "GAME_EXPIRED"
        ? t("game.arena.canceled.expired")
        : t("game.arena.canceled.generic")
  const description =
    canceledReason === "NO_SHOW_START"
      ? t("game.arena.canceled.noShowDescription")
      : canceledReason === "GAME_EXPIRED"
        ? t("game.arena.canceled.expiredDescription")
        : t("game.arena.canceled.genericDescription")

  return (
    <div
      className="qu-immersive-safe grid h-full place-items-center p-6"
      style={{ background: TOKEN.duelBg }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="font-heading text-lg font-bold">{title}</p>
        <p className="text-sm" style={{ color: TOKEN.mutedFg }}>
          {description}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onBackToTopic}>{t("game.arena.backToTopic")}</Button>
          <Button variant="outline" disabled={replayPending} onClick={onReplay}>
            {humanOpponent
              ? t("game.result.newOpponent")
              : t("game.result.replay")}
          </Button>
        </div>
      </div>
    </div>
  )
}
