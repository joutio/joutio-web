import { useTranslation } from "react-i18next"
import type { PlayerSource } from "../../domain/opponents"
import { ChoiceCard } from "./ChoiceCard"
import { PLAYER_SOURCE_CHOICES } from "./options"

interface PlayerSourceStepProps {
  selected: PlayerSource
  onSelect: (source: PlayerSource) => void
}

/** Étape 2 (mode joueur) : où chercher l'adversaire (abonnements / abonnés / recherche universelle). */
export function PlayerSourceStep({
  selected,
  onSelect,
}: PlayerSourceStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-heading text-sm font-bold">
        {t("game.playMode.sourceTitle")}
      </div>
      {PLAYER_SOURCE_CHOICES.map((choice) => (
        <ChoiceCard
          key={choice.id}
          icon={choice.icon}
          title={t(choice.titleKey)}
          desc={t(choice.descKey)}
          selected={selected === choice.id}
          onSelect={() => onSelect(choice.id)}
        />
      ))}
    </div>
  )
}
