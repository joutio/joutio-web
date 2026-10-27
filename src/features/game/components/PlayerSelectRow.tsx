import { useTranslation } from "react-i18next"
import { UserAvatar } from "@/shared/components/user-avatar"
import { SelectRow } from "@/shared/components/select-row"

/** Joueur minimal affiché par une ligne de sélection / un rappel d'adversaire. */
export interface PlayerRef {
  id: string
  label?: string | null
  subtitle?: string | null
  avatarOptions?: string | null
}

interface PlayerSelectRowProps {
  player: PlayerRef
  /** État sélectionné (uniquement si `onSelect` est fourni). */
  selected?: boolean
  /** Fourni ⇒ ligne interactive (bouton + radio) ; absent ⇒ rappel statique. */
  onSelect?: () => void
  className?: string
}

/**
 * Ligne de sélection de joueur — carte commune au parcours « Défier un joueur » (étape de
 * sélection) et au rappel de l'adversaire dans le sélecteur de thème.
 */
export function PlayerSelectRow({
  player,
  selected,
  onSelect,
  className,
}: PlayerSelectRowProps) {
  const { t } = useTranslation()
  const name = player.label ?? t("game.common.player")

  return (
    <SelectRow
      visual={
        <UserAvatar
          name={name}
          userId={player.id}
          avatarOptions={player.avatarOptions ?? undefined}
          size={34}
        />
      }
      title={name}
      subtitle={player.subtitle}
      selected={selected}
      onSelect={onSelect}
      className={className}
    />
  )
}
