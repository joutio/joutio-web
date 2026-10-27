import { Download, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useInstallStore } from "@/shared/stores/useInstallStore"
import { isIos, shouldOfferInstall } from "@/shared/utils/pwa"
import { useInstallPrompt } from "../hooks/useInstallPrompt"

/**
 * Bandeau d'incitation à l'installation en tête de coquille (hors écrans immersifs) : bouton
 * natif Chrome/Edge (`beforeinstallprompt` capté au boot) ou consigne iOS. Le masquage est
 * mémorisé définitivement ; il n'apparaît plus une fois l'app installée.
 */
export function InstallBanner() {
  const { t } = useTranslation()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const dismissed = useInstallStore((state) => state.bannerDismissed)
  const dismissBanner = useInstallStore((state) => state.dismissBanner)
  const iosBrowser = isIos()

  if (
    dismissed ||
    !shouldOfferInstall({ installed, canInstall, ios: iosBrowser })
  ) {
    return null
  }

  return (
    <div className="flex items-center gap-3 border-b bg-primary/[0.06] px-(--page-gutter-x) py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Download className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("shell.install.bannerTitle")}</p>
        <p className="truncate text-xs text-muted-foreground">
          {canInstall
            ? t("shell.install.bannerNative")
            : t("shell.install.bannerIos")}
        </p>
      </div>
      {canInstall && (
        <Button size="sm" onClick={() => void promptInstall()}>
          {t("shell.install.install")}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("shell.install.dismissBanner")}
        className="shrink-0"
        onClick={dismissBanner}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
