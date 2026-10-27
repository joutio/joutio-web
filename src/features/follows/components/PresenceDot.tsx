import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { presenceToneClass } from "@/shared/components/presence-tone"
import { isOnline } from "@/features/player/domain/presence"
import type { Presence } from "@/features/player/domain/presence"

/**
 * Voyant de présence en badge sur l'avatar (le libellé complet est réservé aux fiches) :
 * **gris hors ligne, vert en ligne, jaune suspendu**. Positionné en **pourcentage**
 * (`bottom/right`) pour rester sur le bord du cercle quelle que soit la taille de l'avatar
 * (cartes fixes comme tuiles fluides).
 * `borderClassName` aligne l'anneau sur la surface porteuse : `border-card` sur une Card,
 * `border-background` sur le fond de page (tuiles springboard).
 */
export function PresenceDot({
  presence,
  suspended = false,
  borderClassName = "border-card",
  className,
}: {
  presence: Presence | null
  /** Compte suspendu : le voyant prend la teinte d'alerte jaune. */
  suspended?: boolean
  borderClassName?: string
  /** Taille personnalisée (ex. `size-[14%]` sur les tuiles fluides). */
  className?: string
}) {
  const { t } = useTranslation()
  const online = isOnline(presence)
  const label = online
    ? t("social.presence.online")
    : presence?.lastSeenAt
      ? t("social.presence.recently")
      : t("social.presence.offline")

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "absolute right-[6%] bottom-[6%] size-3 rounded-full border-2",
        borderClassName,
        presenceToneClass(online, suspended),
        className
      )}
    />
  )
}
