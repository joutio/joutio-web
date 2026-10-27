import { useTranslation } from "react-i18next"
import { TOKEN } from "@/shared/theme/tokens"
import { RESULT_WHITE } from "./palette"

interface PlayerMetaProps {
  name: string
  rating: number | null
  ratingDelta?: number | null
  rated?: boolean
  color: string
  suspended?: boolean
}

/** Nom, Elo et variation Elo du duel (2ᵉ ligne de la maquette). */
export function PlayerMeta({
  name,
  rating,
  ratingDelta = 0,
  rated = true,
  color,
  suspended = false,
}: PlayerMetaProps) {
  const { t } = useTranslation()
  const delta = ratingDelta ?? 0
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span
        className="max-w-full truncate"
        style={{
          color,
          fontSize: "clamp(13px, 1.9dvh, 16px)",
          fontWeight: 700,
        }}
      >
        {name}
      </span>
      {suspended ? (
        <span
          style={{
            color: "#f15c6d",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {t("moderation.suspendedBadge")}
        </span>
      ) : null}
      <span
        style={{
          color: RESULT_WHITE,
          fontSize: "clamp(11px, 1.6dvh, 12.5px)",
          fontWeight: 600,
        }}
      >
        {rating != null
          ? t("game.result.elo", { rating })
          : t("game.result.eloUnknown")}
        {rating != null && rated ? (
          <span
            style={{
              color: delta >= 0 ? "#4ade80" : "#f15c6d",
              marginLeft: 4,
            }}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        ) : null}
        {rating != null && !rated ? (
          <span style={{ color: TOKEN.duelSurfaceMuted }}>
            {" "}· {t("game.result.unrated")}
          </span>
        ) : null}
      </span>
    </div>
  )
}
