import { UserRound } from "lucide-react"
import { cn } from "cn"
import {
  baseAvatarBackground,
  DEFAULT_BASE_AVATAR_BACKGROUND,
  normalizeBaseAvatarBackground,
  type BaseAvatarOptions,
} from "@/shared/avatar/config"

interface DefaultAvatarProps {
  backgroundColor?: string
  className?: string
  iconClassName?: string
}

/** Icône de base : silhouette Lucide sur un fond de la palette Micah. */
export function DefaultAvatar({
  backgroundColor = DEFAULT_BASE_AVATAR_BACKGROUND,
  className,
  iconClassName,
}: DefaultAvatarProps) {
  const background = normalizeBaseAvatarBackground(backgroundColor)
  return (
    <span
      className={cn(
        "grid size-full place-items-center rounded-full",
        className
      )}
      style={{
        backgroundColor: background,
        // Toujours légèrement plus sombre que le fond, sans dépendre du thème.
        color: "rgba(24, 24, 27, 0.35)",
      }}
    >
      <UserRound
        aria-hidden
        className={cn("size-[52%]", iconClassName)}
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  )
}

export function DefaultAvatarFromConfig({
  config,
  className,
  iconClassName,
}: {
  config?: BaseAvatarOptions
  className?: string
  iconClassName?: string
}) {
  return (
    <DefaultAvatar
      backgroundColor={config ? baseAvatarBackground(config) : undefined}
      className={className}
      iconClassName={iconClassName}
    />
  )
}
