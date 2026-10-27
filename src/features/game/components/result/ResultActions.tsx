import { useTranslation } from "react-i18next"
import { Flag, Users, Zap } from "lucide-react"
import { cn } from "cn"
import { TOKEN } from "@/shared/theme/tokens"
import { ActionButton } from "./ActionButton"
import { RESULT_LOSS, RESULT_WHITE } from "./palette"

interface ResultActionsProps {
  botGame: boolean
  onReplayBot: () => void
  onChallengeRematch: () => void
  onNewOpponent: () => void
  replayPending?: boolean
  rematchPending: boolean
  /** Secondes restantes de la demande de revanche (0 = pas encore connue). */
  rematchRemainingSeconds?: number
  /** Défi de revanche refusé/expiré : le bouton reste désactivé et affiche l'issue. */
  rematchRefused: boolean
  /** Un défi PENDING existe déjà sur ce sujet : le bouton Revanche est grisé. */
  rematchBlocked?: boolean
  /** Adversaire supprimé : revanche interdite. */
  rematchUnavailable?: boolean
  newOpponentPending?: boolean
  /** Signalement de l'adversaire (jamais pour un bot). */
  reportable?: boolean
  reported?: boolean
  onReportOpponent?: () => void
}

/**
 * Actions de fin de partie : Rejouer (bot) ou Revanche (défi nominatif), Nouvel adversaire,
 * puis signalement de l'adversaire (même bouton d'action, teinte jaune du score du match).
 * Empilées en compact, côte à côte à partir de la tablette ; le signalement occupe toute la
 * largeur sous les deux actions principales.
 */
export function ResultActions({
  botGame,
  onReplayBot,
  onChallengeRematch,
  onNewOpponent,
  replayPending,
  rematchPending,
  rematchRemainingSeconds = 0,
  rematchRefused,
  rematchBlocked = false,
  rematchUnavailable = false,
  newOpponentPending,
  reportable = false,
  reported = false,
  onReportOpponent,
}: ResultActionsProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`grid w-full max-w-[420px] gap-3 ${
        botGame ? "grid-cols-1" : "grid-cols-1 tablet-up:grid-cols-2"
      }`}
    >
      {botGame && (
        <ActionButton
          icon={<Zap size={16} fill={RESULT_WHITE} strokeWidth={0} />}
          background={RESULT_LOSS}
          disabled={replayPending}
          onClick={onReplayBot}
        >
          {t("game.result.replay")}
        </ActionButton>
      )}

      {!botGame && (
        <ActionButton
          icon={<Zap size={16} fill={RESULT_WHITE} strokeWidth={0} />}
          background={
            rematchRefused || rematchBlocked || rematchUnavailable
              ? TOKEN.duelSurfaceMuted
              : RESULT_LOSS
          }
          disabled={
            rematchPending ||
            rematchRefused ||
            rematchBlocked ||
            rematchUnavailable
          }
          onClick={onChallengeRematch}
        >
          {rematchRefused
            ? t("game.result.rematchRefused")
            : rematchPending
              ? rematchRemainingSeconds > 0
                ? t("game.result.rematchPendingCountdown", {
                    seconds: rematchRemainingSeconds,
                  })
                : t("game.result.rematchPending")
              : rematchUnavailable
                ? t("game.result.rematchUnavailable")
                : rematchBlocked
                  ? t("game.result.rematchBlocked")
                  : t("game.result.rematch")}
        </ActionButton>
      )}

      <ActionButton
        icon={<Users size={16} />}
        background={TOKEN.timer}
        disabled={newOpponentPending}
        onClick={onNewOpponent}
      >
        {t("game.result.newOpponent")}
      </ActionButton>

      {reportable ? (
        <div className={cn("w-full", !botGame && "tablet-up:col-span-2")}>
          <ActionButton
            icon={<Flag size={16} />}
            background={TOKEN.gauge}
            disabled={reported}
            onClick={() => onReportOpponent?.()}
          >
            {reported
              ? t("moderation.report.reported")
              : t("moderation.report.action")}
          </ActionButton>
        </div>
      ) : null}
    </div>
  )
}
