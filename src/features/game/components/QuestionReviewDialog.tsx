import { useTranslation } from "react-i18next"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import type { GameState } from "../domain/game"
import { ReviewDeck } from "./ReviewDeck"

interface QuestionReviewDialogProps {
  open: boolean
  onClose: () => void
  game: GameState
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
}

/**
 * Revue des questions d'un duel terminé, en **bottom sheet Arc UI** (tactile) : la feuille
 * accueille le {@link ReviewDeck} — carousel shadcn et pied libellé « Précédent » / « Suivant ».
 * Le contenu est strictement le même que la colonne droite desktop (une seule source de rendu).
 */
export function QuestionReviewDialog({
  open,
  onClose,
  game,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
}: QuestionReviewDialogProps) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      title={t("game.review.title")}
      hideTitle
      hideClose
      detents={SHEET_DETENTS.review}
      closeLabel={t("game.review.close")}
      className="mx-auto"
      surfaceStyle={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        borderColor: "transparent",
        // Plus large que le plafond par défaut (36rem) quand la place le permet : en tablette
        // et en paysage, le replay d'arène respire au lieu de rester dans une colonne étroite.
        width: "min(100%, 52rem)",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <ReviewDeck
        game={game}
        userId={userId}
        opponentId={opponentId}
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        language={language}
      />
    </BottomSheet>
  )
}
