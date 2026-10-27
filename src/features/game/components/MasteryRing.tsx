import { useTranslation } from "react-i18next"
import { TOKEN } from "@/shared/theme/tokens"
import { masteryTierKeyOf } from "@/features/progression"
import { useRingReveal } from "../hooks/useRingReveal"
import { RESULT_WHITE, RESULT_XP } from "./result/palette"

interface MasteryRingProps {
  tier: string
  nextTier: string | null
  /** XP gagnée sur ce duel ; `null` tant que la récompense n'est pas projetée. */
  xpGained: number | null
  /** XP restante dans le sujet avant le palier suivant (0 au dernier palier). */
  tierRemainingXp: number
}

const VIEWBOX = 160
const STROKE = 30
const RADIUS = (VIEWBOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const RING_SIZE = "var(--duel-ring-size)"
const RAD = Math.PI / 180

const CALLOUT_LABEL = {
  fontSize: `calc(${RING_SIZE} * 0.06)`,
  fontWeight: 700,
  letterSpacing: "0.08em",
  lineHeight: 1.2,
} as const

const CALLOUT_VALUE = {
  fontFamily: TOKEN.fontDisplay,
  fontSize: `calc(${RING_SIZE} * 0.2)`,
  fontWeight: 800,
  lineHeight: 1.1,
} as const

const LINE = {
  width: `calc(${RING_SIZE} * 0.16)`,
  height: 2,
  flexShrink: 0,
} as const

const DOT = {
  width: `calc(${RING_SIZE} * 0.035)`,
  height: `calc(${RING_SIZE} * 0.035)`,
  borderRadius: 999,
  flexShrink: 0,
} as const

const CALLOUT_GAP = `calc(${RING_SIZE} * 0.035)`

function tierKey(tier: string) {
  return masteryTierKeyOf(tier)
}

/**
 * Anneau de **maîtrise du sujet** de l'écran de résultat : piste blanche, segment corail de
 * l'XP gagnée sur ce duel, segment blanc de l'XP restante avant le palier suivant. Les deux
 * callouts chiffrés sont les deux segments de l'anneau. Le donut entre dès que la récompense
 * est projetée puis révèle les compteurs de façon solidaire (`useRingReveal`).
 */
export function MasteryRing({
  tier,
  nextTier,
  xpGained,
  tierRemainingXp,
}: MasteryRingProps) {
  const { t } = useTranslation()
  const pending = xpGained == null
  const revealed = !pending
  const gained = xpGained ?? 0
  const remaining = nextTier ? Math.max(0, tierRemainingXp) : 0
  const total = gained + remaining
  const targetPercent = pending
    ? 0
    : total > 0
      ? (gained / total) * 100
      : nextTier
        ? 0
        : 100
  const { percent, gained: shownGained, valueOpacity } = useRingReveal(
    targetPercent,
    gained,
    revealed
  )
  const fill = percent
  const offset = CIRCUMFERENCE * (1 - fill / 100)
  const shownRemaining = total - shownGained

  const currentLabel = t(tierKey(tier))
  const nextLabel = nextTier ? t(tierKey(nextTier)) : null
  const coralMid = Math.max(36, 1.8 * fill) * RAD
  const whiteMid = Math.max(216, 180 + 1.8 * fill) * RAD
  const coralTop = `${(1 - Math.cos(coralMid)) * 50}%`
  const whiteTop = `${(1 - Math.cos(whiteMid)) * 50}%`
  const coralLeft = `calc(50% + ${RING_SIZE} * ${(0.5 * Math.sin(coralMid)).toFixed(4)})`
  const whiteRight = `calc(50% + ${RING_SIZE} * ${(-0.5 * Math.sin(whiteMid)).toFixed(4)})`

  return (
    <div
      className={`relative flex w-full items-center justify-center ${
        revealed ? "qu-pop" : ""
      }`}
      data-testid="mastery-ring"
      role="img"
      style={revealed ? undefined : { opacity: 0 }}
      aria-label={
        revealed
          ? nextLabel
            ? t("game.result.masteryRingAria", {
                tier: currentLabel,
                gained,
                remaining,
                next: nextLabel,
              })
            : t("game.result.masteryRingMaxAria", {
                tier: currentLabel,
                gained,
              })
          : t("game.result.masteryTierAria", { tier: currentLabel })
      }
    >
      <div
        className="absolute flex -translate-y-1/2 items-center"
        style={{ right: whiteRight, top: whiteTop }}
      >
        <div
          className="text-right"
          style={{ marginRight: CALLOUT_GAP, opacity: valueOpacity }}
        >
          <div style={{ ...CALLOUT_LABEL, color: RESULT_WHITE }}>
            {nextLabel
              ? t("game.result.xpBeforeTier", { tier: nextLabel.toUpperCase() })
              : t("game.result.maxTier")}
          </div>
          <div style={{ ...CALLOUT_VALUE, color: RESULT_WHITE }}>
            {shownRemaining}
          </div>
        </div>
        <div style={{ ...DOT, background: RESULT_WHITE }} />
        <div style={{ ...LINE, background: RESULT_WHITE }} />
      </div>

      <div
        className="relative shrink-0"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            stroke={RESULT_WHITE}
            strokeWidth={STROKE}
          />
          {!pending && (
            <circle
              data-testid="mastery-ring-fill"
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={RADIUS}
              fill="none"
              stroke={RESULT_XP}
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{
              color: RESULT_WHITE,
              fontSize: `calc(${RING_SIZE} * 0.075)`,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            {t("game.result.masteryLabel")}
          </span>
          <span
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: `calc(${RING_SIZE} * 0.15)`,
              fontWeight: 800,
              color: RESULT_WHITE,
              marginTop: `calc(${RING_SIZE} * 0.03)`,
              textAlign: "center",
              maxWidth: "78%",
            }}
          >
            {currentLabel}
          </span>
        </div>
      </div>

      <div
        className="absolute flex -translate-y-1/2 items-center"
        style={{ left: coralLeft, top: coralTop }}
      >
        <div style={{ ...LINE, background: RESULT_XP }} />
        <div style={{ ...DOT, background: RESULT_XP }} />
        <div style={{ marginLeft: CALLOUT_GAP, opacity: valueOpacity }}>
          <div style={{ ...CALLOUT_LABEL, color: RESULT_XP }}>
            {t("game.result.xpGained")}
          </div>
          <div style={{ ...CALLOUT_VALUE, color: RESULT_XP }}>
            {shownGained}
          </div>
        </div>
      </div>
    </div>
  )
}
