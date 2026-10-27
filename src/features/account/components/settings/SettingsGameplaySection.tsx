import { useTranslation } from "react-i18next"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { useMatchmakingPreferencesStore } from "@/features/matchmaking"

/**
 * Section « Jeu » : comportement d'appariement. Le repli bot automatique est actif par défaut
 * pour éviter d'enchaîner les clics après une recherche sans adversaire ; il reste désactivable
 * pour les joueurs qui veulent attendre un humain.
 */
export function SettingsGameplaySection() {
  const { t } = useTranslation()
  const autoTrain = useMatchmakingPreferencesStore(
    (state) => state.autoTrainOnTimeout
  )
  const setAutoTrain = useMatchmakingPreferencesStore(
    (state) => state.setAutoTrainOnTimeout
  )

  return (
    <FormSection title={t("shell.settings.sections.gameplay")}>
      <FormRow
        label={t("shell.settings.matchmaking.autoTrain.label")}
        description={t("shell.settings.matchmaking.autoTrain.description")}
        controlClassName="flex tablet-up:justify-end"
      >
        <AnimatedSwitch
          label={t("shell.settings.matchmaking.autoTrain.label")}
          checked={autoTrain}
          onCheckedChange={setAutoTrain}
        />
      </FormRow>
    </FormSection>
  )
}
