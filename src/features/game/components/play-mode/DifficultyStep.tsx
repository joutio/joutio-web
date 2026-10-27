import { useTranslation } from "react-i18next"
import type { BotDifficulty } from "../../domain/game-dto"
import { ChoiceCard } from "./ChoiceCard"
import { DIFFICULTIES } from "./options"

interface DifficultyStepProps {
  selected: BotDifficulty
  onSelect: (difficulty: BotDifficulty) => void
}

/** Étape 2 (mode bot) : choix de la difficulté. */
export function DifficultyStep({ selected, onSelect }: DifficultyStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-heading text-sm font-bold">
        {t("game.playMode.difficultyTitle")}
      </div>
      {DIFFICULTIES.map((option) => (
        <ChoiceCard
          key={option.value}
          icon={option.icon}
          title={t(option.labelKey)}
          desc={t(option.hintKey)}
          selected={selected === option.value}
          onSelect={() => onSelect(option.value)}
        />
      ))}
    </div>
  )
}
