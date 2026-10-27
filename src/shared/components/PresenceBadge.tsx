import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { cn } from "@/lib/utils"
import { presenceToneClass } from "./presence-tone"

interface PresenceBadgeProps {
  online: boolean
  lastSeenAt?: string | null
  /** Compte suspendu : le point de présence prend la teinte d'alerte jaune. */
  suspended?: boolean
  className?: string
}

/** Horodatage relatif compact (« il y a 5 min », « il y a 3 j »). */
function relativeLabel(iso: string, t: TFunction): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return t("shared.presence.time.recent")

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (seconds < 60) return t("shared.presence.time.justNow")

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t("shared.presence.time.minutes", { count: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("shared.presence.time.hours", { count: hours })

  const days = Math.floor(hours / 24)
  if (days < 7) return t("shared.presence.time.days", { count: days })

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return t("shared.presence.time.weeks", { count: weeks })

  const months = Math.floor(days / 30)
  if (months < 12) return t("shared.presence.time.months", { count: months })

  const years = Math.floor(days / 365)
  return t(
    years > 1
      ? "shared.presence.time.yearsPlural"
      : "shared.presence.time.years",
    { count: years }
  )
}

/** Pastille de présence joueur — point gris hors ligne, vert en ligne, jaune suspendu. */
export function PresenceBadge({
  online,
  lastSeenAt,
  suspended = false,
  className,
}: PresenceBadgeProps) {
  const { t } = useTranslation()
  const label = online
    ? t("shared.presence.online")
    : lastSeenAt
      ? t("shared.presence.seen", { time: relativeLabel(lastSeenAt, t) })
      : t("shared.presence.offline")

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          presenceToneClass(online, suspended)
        )}
      />
      {label}
    </span>
  )
}
