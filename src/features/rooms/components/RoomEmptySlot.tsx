import { useTranslation } from "react-i18next"
import { UserPlus } from "lucide-react"
import { TOKEN } from "@/shared/theme/tokens"

/** Emplacement vide d'un salon partagé : en attente d'un second joueur. */
export function RoomEmptySlot() {
  const { t } = useTranslation()
  return (
    <div className="flex w-24 flex-col items-center gap-2.5 desktop:w-28">
      <div
        className="grid size-[72px] place-items-center rounded-full border-2 border-dashed desktop:size-[96px]"
        style={{ borderColor: TOKEN.mutedFg, color: TOKEN.mutedFg }}
      >
        <UserPlus className="size-[26px] desktop:size-8" aria-hidden />
      </div>
      <span className="text-xs text-muted-foreground">
        {t("game.room.guest")}
      </span>
    </div>
  )
}
