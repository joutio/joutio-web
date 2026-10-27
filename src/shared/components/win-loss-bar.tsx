import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { winLossSegments } from "@/shared/utils/win-loss"

const LABEL_KEYS = {
  wins: "shared.winLoss.wins",
  draws: "shared.winLoss.draws",
  losses: "shared.winLoss.losses",
} as const

/**
 * Barre de résultats V / N / D (statistiques d'un joueur), fidèle à la référence Joutio
 * (`product/img_9.png`) : capsule unique — seuls les bords **extérieurs** sont arrondis, les
 * jonctions entre segments restent droites, séparées par un gap. Labels sombres au-dessus,
 * pourcentages colorés en dessous. **Masquée si aucun résultat** et seuls les segments non nuls
 * sont affichés. Purement présentationnel.
 */
interface WinLossBarProps {
  wins: number
  draws: number
  losses: number
  className?: string
}

export function WinLossBar({
  wins,
  draws,
  losses,
  className,
}: WinLossBarProps) {
  const { t } = useTranslation()
  const segments = winLossSegments({ wins, draws, losses })
  if (segments.length === 0) {
    return null
  }

  /* Chaque label / pourcentage est centré sur son segment (mêmes proportions que la barre). */
  const columns = segments.map((segment) => `${segment.value}fr`).join(" ")

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className="mb-2 grid text-xs font-semibold text-foreground"
        style={{ gridTemplateColumns: columns }}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className="px-1 text-center whitespace-nowrap"
          >
            {t(LABEL_KEYS[segment.key])}
          </span>
        ))}
      </div>
      <div className="flex h-4 gap-1.5">
        {segments.map((segment, index) => (
          <span
            key={segment.key}
            className={cn(
              "min-w-0",
              index === 0 && "rounded-l-full",
              index === segments.length - 1 && "rounded-r-full",
              segment.barClassName
            )}
            style={{ flexGrow: segment.value, flexBasis: 0 }}
          />
        ))}
      </div>
      <div
        className="mt-3 grid text-sm font-bold tabular-nums"
        style={{ gridTemplateColumns: columns }}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={cn("text-center", segment.textClassName)}
          >
            {segment.percent}%
          </span>
        ))}
      </div>
    </div>
  )
}
