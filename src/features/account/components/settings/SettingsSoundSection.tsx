import { useTranslation } from "react-i18next"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { playNotificationChime } from "@/shared/audio"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Section « Sons » : interrupteur unique (notifications, réponses en duel, fin de duel et
 * confirmations de succès). L'activation joue un aperçu du son de notification.
 */
export function SettingsSoundSection() {
  const { t } = useTranslation()
  const enabled = useSoundStore((state) => state.enabled)
  const setEnabled = useSoundStore((state) => state.setEnabled)

  const onToggle = (checked: boolean) => {
    setEnabled(checked)
    if (checked) playNotificationChime()
  }

  return (
    <FormSection title={t("shell.settings.sections.sounds")}>
      <FormRow
        label={t("shell.settings.sounds.label")}
        description={t("shell.settings.sounds.description")}
        controlClassName="flex tablet-up:justify-end"
      >
        <AnimatedSwitch
          label={t("shell.settings.sounds.label")}
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </FormRow>
    </FormSection>
  )
}
