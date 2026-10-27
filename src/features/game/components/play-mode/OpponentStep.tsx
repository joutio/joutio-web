import { useTranslation } from "react-i18next"
import { ChoiceCard } from "./ChoiceCard"
import { OPPONENT_CHOICES, type Opponent } from "./options"

interface OpponentStepProps {
  selected: Opponent
  onSelect: (opponent: Opponent) => void
  /** Choix indisponibles (ex. salon déjà ouvert sur le sujet). */
  disabled?: ReadonlySet<Opponent>
}

/** Étape 1 : choix de l'adversaire (monde / joueur / bot / salon privé). */
export function OpponentStep({
  selected,
  onSelect,
  disabled = new Set<Opponent>(),
}: OpponentStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-heading text-sm font-bold">
        {t("game.playMode.whoTitle")}
      </div>
      {OPPONENT_CHOICES.map((choice) => (
        <ChoiceCard
          key={choice.id}
          icon={choice.icon}
          title={t(choice.titleKey)}
          desc={t(choice.descKey)}
          selected={selected === choice.id}
          onSelect={() => onSelect(choice.id)}
          disabled={disabled.has(choice.id)}
        />
      ))}
    </div>
  )
}
