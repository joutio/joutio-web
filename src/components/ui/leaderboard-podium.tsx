import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Crown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { UserAvatar } from "@/shared/components/user-avatar"

// Types (inlined)
interface LeaderboardRanking {
  userId: string
  userName: string | null
  rank: number
  value: number
  avatarUrl?: string | null
  avatarOptions?: string | null
  rating?: number | null
  provisional?: boolean
}

// Variants
const podiumVariants = cva("flex items-end justify-center gap-4", {
  variants: {
    size: {
      sm: "gap-2",
      default: "gap-4",
      lg: "gap-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

// Podium styles for each position
const PODIUM_CONFIG = {
  1: {
    icon: Crown,
    color: "text-rank-1",
    bg: "bg-rank-1/60",
    ringColor: "ring-rank-1/50",
    height: "h-32",
    heightSm: "h-24",
    heightLg: "h-40",
  },
  2: {
    icon: Crown,
    color: "text-rank-2",
    bg: "bg-rank-2/30",
    ringColor: "ring-rank-2/50",
    height: "h-24",
    heightSm: "h-20",
    heightLg: "h-32",
  },
  3: {
    icon: Crown,
    color: "text-rank-3",
    bg: "bg-rank-3/50",
    ringColor: "ring-rank-3/50",
    height: "h-20",
    heightSm: "h-16",
    heightLg: "h-28",
  },
} as const

// Props
interface LeaderboardPodiumProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof podiumVariants> {
  /** Top 3 rankings (expects at least 1, ideally 3) */
  rankings: LeaderboardRanking[]
  /** Show value below name */
  showValue?: boolean
  /** Show avatar */
  showAvatar?: boolean
  /** Crown badge style variant */
  medalStyle?: "classic" | "modern" | "minimal"
  /** Clic sur l'avatar d'un joueur (navigation vers sa fiche). */
  onUserClick?: (ranking: LeaderboardRanking) => void
}

const LeaderboardPodium = React.forwardRef<
  HTMLDivElement,
  LeaderboardPodiumProps
>(
  (
    {
      className,
      size,
      rankings,
      showValue = true,
      showAvatar = true,
      medalStyle = "classic",
      onUserClick,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation()
    // Get top 3, reorder for podium display: 2nd, 1st, 3rd
    const top3 = rankings.slice(0, 3)
    const podiumOrder = [
      top3.find((r) => r.rank === 2),
      top3.find((r) => r.rank === 1),
      top3.find((r) => r.rank === 3),
    ].filter(Boolean) as LeaderboardRanking[]

    if (podiumOrder.length === 0) {
      return null
    }

    const avatarSize = {
      sm: "h-10 w-10 text-sm",
      default: "h-14 w-14 text-lg",
      lg: "h-20 w-20 text-2xl",
    }[size ?? "default"]

    const avatarPx = {
      sm: 40,
      default: 56,
      lg: 80,
    }[size ?? "default"]

    const iconSize = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6",
    }[size ?? "default"]

    const textSize = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    }[size ?? "default"]

    return (
      <div
        ref={ref}
        className={cn(podiumVariants({ size }), className)}
        role="list"
        aria-label={t("shared.leaderboard.top3Aria")}
        {...props}
      >
        {podiumOrder.map((ranking) => {
          const config = PODIUM_CONFIG[ranking.rank as 1 | 2 | 3]
          if (!config) return null

          const displayName =
            ranking.userName ||
            t("shared.leaderboard.userFallback", {
              id: ranking.userId.slice(0, 6),
            })
          const podiumHeight = {
            sm: config.heightSm,
            default: config.height,
            lg: config.heightLg,
          }[size ?? "default"]

          const itemLabel = showValue
            ? t("shared.leaderboard.itemAriaWithValue", {
                rank: ranking.rank,
                name: displayName,
                value: ranking.value.toLocaleString(),
              })
            : t("shared.leaderboard.itemAria", {
                rank: ranking.rank,
                name: displayName,
              })

          const avatar = ranking.avatarUrl ? (
            <img
              src={ranking.avatarUrl}
              alt={t("shared.leaderboard.avatarAlt", { name: displayName })}
              className={cn("rounded-full object-cover", avatarSize)}
            />
          ) : (
            <UserAvatar
              name={displayName}
              userId={ranking.userId}
              avatarOptions={ranking.avatarOptions ?? undefined}
              rating={ranking.rating}
              provisional={ranking.provisional}
              size={avatarPx}
            />
          )

          return (
            <div
              key={ranking.userId}
              role="listitem"
              aria-label={itemLabel}
              className="flex flex-col items-center"
            >
              {/* Avatar with crown */}
              <div
                className="relative mb-2"
                aria-hidden={onUserClick ? undefined : true}
              >
                {showAvatar ? (
                  onUserClick ? (
                    <button
                      type="button"
                      onClick={() => onUserClick(ranking)}
                      aria-label={t("shared.leaderboard.viewProfile", {
                        name: displayName,
                      })}
                      className="block cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {avatar}
                    </button>
                  ) : (
                    avatar
                  )
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full",
                      avatarSize,
                      config.bg
                    )}
                  >
                    <config.icon className={cn(iconSize, config.color)} />
                  </div>
                )}

                {/* Crown badge */}
                {medalStyle !== "minimal" && (
                  <div
                    className={cn(
                      "absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-background",
                      size === "sm"
                        ? "h-5 w-5"
                        : size === "lg"
                          ? "h-8 w-8"
                          : "h-6 w-6"
                    )}
                  >
                    <config.icon
                      className={cn(
                        config.color,
                        size === "sm"
                          ? "h-3 w-3"
                          : size === "lg"
                            ? "h-5 w-5"
                            : "h-4 w-4"
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <span
                className={cn(
                  "max-w-20 truncate text-center font-medium",
                  textSize
                )}
                title={displayName}
              >
                {displayName}
              </span>

              {/* Value */}
              {showValue && (
                <span
                  className={cn(
                    "text-muted-foreground tabular-nums",
                    size === "sm" ? "text-xs" : "text-sm"
                  )}
                >
                  {ranking.value.toLocaleString()}
                </span>
              )}

              {/* Podium block */}
              <div
                aria-hidden="true"
                className={cn(
                  "mt-2 w-22 rounded-t-lg",
                  size === "sm" && "w-20",
                  size === "lg" && "w-24",
                  podiumHeight,
                  config.bg,
                  medalStyle === "modern" && "rounded-t-xl"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 items-center justify-center font-bold",
                    config.color
                  )}
                >
                  {ranking.rank}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)
LeaderboardPodium.displayName = "LeaderboardPodium"

export { LeaderboardPodium, podiumVariants }
export type { LeaderboardPodiumProps, LeaderboardRanking }
