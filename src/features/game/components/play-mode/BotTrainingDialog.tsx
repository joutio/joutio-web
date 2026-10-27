import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import type { BotDifficulty } from "../../domain/game-dto"
import { DifficultyStep } from "./DifficultyStep"

interface BotTrainingDialogProps {
  open: boolean
  onClose: () => void
  onStart: (difficulty: BotDifficulty) => void
  pending?: boolean
}

/**
 * Entraînement contre un robot en **wizard** (même gabarit que la popup « Lancer un duel » :
 * bandeau d'étape + étape difficulté + pied « Annuler / Lancer »). Ouvert depuis la popup de fin
 * d'appariement (« Aucun adversaire trouvé ») : démarre une **salle bot** (le bot la rejoint
 * automatiquement) — duel sans XP.
 */
export function BotTrainingDialog({
  open,
  onClose,
  onStart,
  pending = false,
}: BotTrainingDialogProps) {
  const { t } = useTranslation()
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL")

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={t("game.playMode.choices.bot.title")}
      sub={t("game.playMode.choices.bot.description")}
      className="sm:max-w-md"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      toolbar={
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("game.playMode.step", { current: 1, total: 1 })}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
        </div>
      }
      footer={
        <>
          <div className="flex-1 touch:hidden" />
          <Button variant="outline" onClick={onClose}>
            {t("game.playMode.cancel")}
          </Button>
          <Button onClick={() => onStart(difficulty)} disabled={pending}>
            {t("game.playMode.launch")}
          </Button>
        </>
      }
    >
      <DifficultyStep selected={difficulty} onSelect={setDifficulty} />
    </AppDialog>
  )
}
