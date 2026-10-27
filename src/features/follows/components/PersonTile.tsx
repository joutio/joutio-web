import { useTranslation } from "react-i18next"
import { EntityTile } from "@/shared/components/entity-tile"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { UserAvatar } from "@/shared/components/user-avatar"
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile"
import { PresenceDot } from "./PresenceDot"

/**
 * Tuile de personne **springboard iOS** — présentation unique, à toutes les tailles : avatar
 * fluide avec le voyant de présence ancré, nom seul — aucune carte, aucun niveau (la fiche
 * joueur porte le détail).
 */
export function PersonTile({
  person,
  onOpen,
}: {
  person: PlayerCardView
  onOpen: (userId: string) => void
}) {
  const { t } = useTranslation()
  const name = person.pseudonym ?? t("social.card.fallbackName")

  return (
    <EntityTile
      dataSlot="person-tile"
      visual={
        <span className="relative aspect-square w-full">
          <UserAvatar
            name={name}
            userId={person.userId}
            avatarOptions={person.avatarOptions ?? undefined}
            fluid
            rating={person.rating}
            provisional={person.provisional}
            className="absolute inset-0"
          />
          <PresenceDot
            presence={person.presence}
            suspended={person.suspended}
            borderClassName="border-background"
            className="size-[14%]"
          />
        </span>
      }
      title={name}
      trailing={
        person.suspended ? <SuspendedBadge className="scale-90" /> : null
      }
      onClick={() => onOpen(person.userId)}
    />
  )
}
