import { useTranslation } from "react-i18next"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { FormRow, FormSection } from "@/shared/components/form-section"
import {
  PushNotificationSetting,
  useNotificationPreferences,
  useUpdateNotificationPreference,
  type NotificationCategory,
} from "@/features/notifications"

/** Section « Notifications » : interrupteurs par catégorie + push appareil, persistés côté BFF. */
export function SettingsNotificationsSection() {
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  const updatePreference = useUpdateNotificationPreference()

  const preferenceEnabled = (category: NotificationCategory): boolean =>
    preferences.data?.find((preference) => preference.category === category)
      ?.enabled ?? true

  const togglePreference = (
    category: NotificationCategory,
    enabled: boolean
  ) => {
    updatePreference.mutate({ category, enabled })
  }

  return (
    <FormSection
      title={t("shell.settings.sections.notifications")}
      sub={t("shell.settings.notificationPreferences.sub")}
    >
      <FormRow
        label={t("shell.settings.notificationPreferences.follows.label")}
        description={t(
          "shell.settings.notificationPreferences.follows.description"
        )}
        controlClassName="flex tablet-up:justify-end"
      >
        <AnimatedSwitch
          label={t("shell.settings.notificationPreferences.follows.label")}
          checked={preferenceEnabled("FOLLOW")}
          disabled={updatePreference.isPending}
          onCheckedChange={(checked) => togglePreference("FOLLOW", checked)}
        />
      </FormRow>

      <FormRow
        label={t("shell.settings.notificationPreferences.challenges.label")}
        description={t(
          "shell.settings.notificationPreferences.challenges.description"
        )}
        controlClassName="flex tablet-up:justify-end"
      >
        <AnimatedSwitch
          label={t("shell.settings.notificationPreferences.challenges.label")}
          checked={preferenceEnabled("ROOM")}
          disabled={updatePreference.isPending}
          onCheckedChange={(checked) => togglePreference("ROOM", checked)}
        />
      </FormRow>

      <FormRow
        label={t("shell.settings.notificationPreferences.questionReports.label")}
        description={t(
          "shell.settings.notificationPreferences.questionReports.description"
        )}
        controlClassName="flex tablet-up:justify-end"
      >
        <AnimatedSwitch
          label={t("shell.settings.notificationPreferences.questionReports.label")}
          checked={preferenceEnabled("QUESTION")}
          disabled={updatePreference.isPending}
          onCheckedChange={(checked) => togglePreference("QUESTION", checked)}
        />
      </FormRow>

      <PushNotificationSetting />
    </FormSection>
  )
}
