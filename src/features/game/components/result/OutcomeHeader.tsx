import { useTranslation } from "react-i18next"
import { LogOut } from "lucide-react"
import { TOKEN } from "@/shared/theme/tokens"

interface OutcomeHeaderProps {
  win: boolean
  draw: boolean
  titleColor: string
  topicName: string
  forfeitLabel: string | null
}

/** En-tête « Fin du match » : issue colorée, sujet et mention de forfait. */
export function OutcomeHeader({
  win,
  draw,
  titleColor,
  topicName,
  forfeitLabel,
}: OutcomeHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          color: titleColor,
          fontSize: "clamp(10px, 1.5dvh, 12px)",
          fontWeight: 700,
          letterSpacing: "0.18em",
        }}
      >
        {t("game.result.end")}
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: "clamp(28px, 5.6dvh, 44px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: titleColor,
          lineHeight: 1.08,
          marginTop: "clamp(1px, 0.4dvh, 4px)",
        }}
      >
        {draw
          ? t("game.result.draw")
          : win
            ? t("game.result.victory")
            : t("game.result.defeat")}
      </div>
      {topicName && (
        <div
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(10px, 1.5dvh, 12.5px)",
            marginTop: "clamp(1px, 0.4dvh, 4px)",
          }}
        >
          {topicName}
        </div>
      )}
      {forfeitLabel && (
        <div
          className="flex items-center gap-1.5"
          style={{
            color: TOKEN.gauge,
            fontSize: "clamp(11px, 1.6dvh, 13px)",
            fontWeight: 600,
            marginTop: "clamp(3px, 0.8dvh, 6px)",
          }}
        >
          <LogOut size={13} aria-hidden />
          {forfeitLabel}
        </div>
      )}
    </div>
  )
}
