import { RefreshCw, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useAppVersion } from "../hooks/useAppVersion"

/**
 * Bandeau de mise à jour de joutio-web (hors écrans immersifs) : avertit qu'un nouveau build
 * est déployé et propose un rechargement — même format que « Partie en cours ».
 * La fermeture vaut pour le build détecté (mémorisée localement).
 */
export function UpdateBanner() {
  const { t } = useTranslation()
  const { updateAvailable, dismiss, reload } = useAppVersion()

  return (
    <AnimatePresence initial={false}>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-3 border-b bg-primary/[0.06] px-(--page-gutter-x) py-2.5"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <RefreshCw className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("shell.update.title")}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t("shell.update.description")}
            </p>
          </div>
          <Button size="sm" onClick={reload}>
            {t("shell.update.reload")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("shell.update.dismiss")}
            className="shrink-0"
            onClick={dismiss}
          >
            <X className="size-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
