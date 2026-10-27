import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { isIos, shouldOfferInstall } from "@/shared/utils/pwa"
import { useInstallPrompt } from "@/features/shell"

/**
 * Section « Application » (Réglages) : installable via le bouton natif (Chrome/Edge,
 * `beforeinstallprompt` capté au boot) ou consignes iOS (Partager → écran d'accueil, prérequis
 * du push). **Masquée** si l'app est déjà installée ou si le navigateur ne permet pas
 * l'installation (Firefox, Safari macOS…).
 */
export function InstallAppSection() {
  const { t } = useTranslation()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const iosBrowser = isIos()

  if (!shouldOfferInstall({ installed, canInstall, ios: iosBrowser })) {
    return null
  }

  return (
    <FormSection
      title={t("shell.install.sectionTitle")}
      sub={t("shell.install.sectionSub")}
    >
      <FormRow
        label={t("shell.install.rowLabel")}
        description={
          canInstall ? t("shell.install.rowNative") : t("shell.install.rowIos")
        }
        controlClassName="flex tablet-up:justify-end"
      >
        {canInstall ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void promptInstall()}
          >
            {t("shell.install.install")}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("shell.install.homeScreen")}
          </span>
        )}
      </FormRow>
    </FormSection>
  )
}
