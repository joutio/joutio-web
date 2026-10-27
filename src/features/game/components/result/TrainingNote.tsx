import { useTranslation } from "react-i18next"
import { Bot } from "lucide-react"
import { TOKEN, veil } from "@/shared/theme/tokens"

/**
 * Entraînement (duel contre bot) : **aucune XP**. La note remplace l'anneau de maîtrise — qui
 * matérialise un gain — et rappelle que la progression vient des duels entre joueurs. Aucun
 * repère de niveau de compte : la note doit rester **lisible** sur le fond sombre du duel.
 */
export function TrainingNote() {
  const { t } = useTranslation()

  return (
    <div
      className="flex w-full max-w-[420px] items-center gap-3.5 rounded-xl border"
      style={{
        borderColor: veil(TOKEN.gauge, 55),
        background: veil(TOKEN.duelSurface, 6),
        padding: "clamp(10px, 1.8dvh, 16px) clamp(12px, 3vw, 18px)",
      }}
    >
      <Bot
        size={22}
        aria-hidden
        style={{ color: TOKEN.gauge, flexShrink: 0 }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          style={{
            color: TOKEN.gauge,
            fontSize: "clamp(11px, 1.6dvh, 13.5px)",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {t("game.result.training.title")}
        </span>
        <span
          style={{
            color: TOKEN.duelSurface,
            fontSize: "clamp(11px, 1.55dvh, 13.5px)",
            lineHeight: 1.3,
          }}
        >
          {t("game.result.training.note")}
        </span>
      </div>
    </div>
  )
}
