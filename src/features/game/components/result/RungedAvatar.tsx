import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  UserAvatar,
  type AvatarIdentity,
} from "@/shared/components/user-avatar"
import { veil } from "@/shared/theme/tokens"

interface RungedAvatarProps {
  name: string
  avatar?: AvatarIdentity
  ringColor: string
}

/** Avatar agrandi, cerclé par l'issue du duel, avec halo doux. Cliquable vers la fiche du joueur. */
export function RungedAvatar({ name, avatar, ringColor }: RungedAvatarProps) {
  const { t } = useTranslation()
  const frame = (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: "clamp(52px, 9dvh, 72px)",
        height: "clamp(52px, 9dvh, 72px)",
        border: `3px solid ${ringColor}`,
        padding: 3,
        boxShadow: `0 0 22px ${veil(ringColor, 45)}`,
      }}
    >
      <UserAvatar
        name={name}
        userId={avatar?.userId}
        avatarOptions={avatar?.avatarOptions}
        initialOnly={avatar?.initialOnly}
        size={72}
        fluid
      />
    </div>
  )

  const userId = avatar?.userId
  if (!userId) return frame

  return (
    <Link
      to={`/players/${userId}`}
      aria-label={t("game.result.viewProfile", { name })}
      className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {frame}
    </Link>
  )
}
