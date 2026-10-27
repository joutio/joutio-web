import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"

interface NoOpponentDialogProps {
  open: boolean
  /** Relance une recherche (nouveau ticket sur le même sujet). */
  onRetry: () => void
  /** Bascule sur l'entraînement contre un robot (ouvre le choix de difficulté). */
  onTrain: () => void
  /** Quitte l'écran de recherche (retour **natif**, cf. `useGoBack`) sans relancer. */
  onCancel: () => void
  retryPending?: boolean
}

/**
 * Popup affichée quand la fenêtre de recherche (10 s) s'écoule sans adversaire **et** que le
 * repli bot automatique est désactivé (ou a échoué) : le joueur choisit de relancer une
 * recherche, de s'entraîner contre un robot, ou d'**annuler** (retour natif vers l'écran
 * d'origine). Le choix est **explicite** : modale **centrée sur tous les devices** (jamais une
 * bottom sheet, qui se laisse glisser), sans croix ni clic extérieur ni Échap — comme
 * l'invitation de défi.
 */
export function NoOpponentDialog({
  open,
  onRetry,
  onTrain,
  onCancel,
  retryPending = false,
}: NoOpponentDialogProps) {
  const { t } = useTranslation()

  return (
    <AppDialog
      open={open}
      onClose={() => undefined}
      title={t("game.matchmaking.noOpponentTitle")}
      sub={t("game.matchmaking.noOpponentSub")}
      dismissible={false}
      showCloseButton={false}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button className="w-full" onClick={onTrain}>
            {t("game.matchmaking.train")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={retryPending}
            onClick={onRetry}
          >
            {t("game.matchmaking.retry")}
          </Button>
          <Button variant="destructive" className="w-full" onClick={onCancel}>
            {t("game.matchmaking.cancel")}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">
        {t("game.matchmaking.noOpponentBody")}
      </p>
    </AppDialog>
  )
}
