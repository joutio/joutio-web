import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import { TOKEN } from "@/shared/theme/tokens"

interface IdentityProps {
  name: string
  rating?: number
  country?: string
  avatar: ReactNode
  side: "top" | "bottom"
}

/** Bloc identité d'un camp (avatar animé + nom, Elo, pays) de l'écran VS. */
export function Identity({
  name,
  rating,
  country,
  avatar,
  side,
}: IdentityProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const reversed = side === "bottom"
  const flag = countryFlag(country)
  const label = countryLabel(country, locale) || country || ""
  return (
    <div
      className={cn(
        "relative flex items-center gap-5",
        reversed && "flex-row-reverse"
      )}
      style={{ zIndex: 2 }}
    >
      <span
        aria-hidden
        className={side === "top" ? "qu-vs-left" : "qu-vs-right"}
        style={{ animationDelay: ".36s" }}
      >
        {avatar}
      </span>
      <div
        className={side === "top" ? "qu-vs-left" : "qu-vs-right"}
        style={{
          textAlign: reversed ? "right" : "left",
          animationDelay: ".44s",
        }}
      >
        <div
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: "clamp(22px, 3.2vw, 34px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: TOKEN.fg,
          }}
        >
          {name}
        </div>
        {rating != null && rating > 0 ? (
          <div style={{ color: TOKEN.mutedFg, fontSize: 13.5 }}>
            {t("game.common.elo", { rating })}
          </div>
        ) : null}
        {label ? (
          <div style={{ color: TOKEN.mutedFg, fontSize: 13.5, marginTop: 2 }}>
            {flag} {label}
          </div>
        ) : null}
      </div>
    </div>
  )
}
