import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { FormRow } from "@/shared/components/form-section"
import { showToast } from "@/shared/utils/toast"
import { isIos, isStandalone } from "@/shared/utils/pwa"
import { useWebPush, type PushPermission } from "../hooks/useWebPush"

function descriptionFor(
  permission: PushPermission,
  subscribed: boolean,
  t: TFunction
): string {
  if (permission === "unsupported") {
    return isIos() && !isStandalone()
      ? t("notifications.push.unsupportedIos")
      : t("notifications.push.unsupported")
  }
  if (permission === "denied") {
    return t("notifications.push.denied")
  }
  return subscribed
    ? t("notifications.push.subscribed")
    : t("notifications.push.unsubscribed")
}

/**
 * Réglage « Notifications push » : canal appareil (là où les préférences serveur filtrent par
 * catégorie). L'activation demande la permission dans le geste utilisateur (requis par iOS).
 */
export function PushNotificationSetting() {
  const { t } = useTranslation()
  const push = useWebPush()

  const onToggle = (checked: boolean) => {
    void (checked ? push.enable() : push.disable()).catch(() => {
      showToast({
        tone: "danger",
        title: t(
          checked
            ? "notifications.push.enableError"
            : "notifications.push.disableError"
        ),
      })
    })
  }

  return (
    <FormRow
      label={t("notifications.push.label")}
      description={descriptionFor(push.permission, push.subscribed, t)}
      controlClassName="flex tablet-up:justify-end"
    >
      <AnimatedSwitch
        label={t("notifications.push.label")}
        checked={push.subscribed}
        disabled={!push.supported || push.permission === "denied" || push.busy}
        onCheckedChange={onToggle}
      />
    </FormRow>
  )
}
