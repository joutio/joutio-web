import {
  DONUT_CIRCUMFERENCE,
  DONUT_R_INNER,
  DONUT_R_MID,
  DONUT_R_OUTER,
  type TopicsPlayedChart,
} from "../domain/topics-played-chart"
import { useDonutReveal } from "../hooks/useDonutReveal"

interface TopicsPlayedDonutProps {
  chart: TopicsPlayedChart
  ariaLabel: string
}

/** Taille (unités) des compteurs au centre des parts, proportionnelle à l'anneau. */
const COUNT_FONT = 5
/** Libellés **fluides** : bornés à l'échelle de la boîte (12 px en compact → 16 px en desktop). */
const LABEL_FONT = "clamp(12px, 2.5cqw, 16px)"

/**
 * Donut « Sujets joués » (maquette `img_9`) : anneau de parts colorées, **compteur au centre de
 * chaque part**, et libellés extérieurs reliés par une pastille + un tracé pointé. Le plan
 * (parts, compteurs, ancres) est calculé par `buildTopicsPlayedChart` ; ce composant ne fait que
 * le rendre, à l'échelle de la boîte (`@container` : viewBox 100 × 100 ↔ carré fluide, libellés
 * en `cqw`), avec le **reveal d'ouverture d'onglet** (arcs qui se dessinent, compteurs, fondu des
 * libellés — `useDonutReveal`).
 */
export function TopicsPlayedDonut({
  chart,
  ariaLabel,
}: TopicsPlayedDonutProps) {
  const { segments } = chart
  const { progress, labelOpacity, countOpacity } = useDonutReveal()

  return (
    <div
      className="@container relative mx-auto aspect-square w-full max-w-[32rem] tablet:max-w-[36rem] desktop:max-w-[44rem]"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        {segments.map((segment) => (
          <circle
            key={`arc-${segment.key}`}
            cx={50}
            cy={50}
            r={DONUT_R_MID}
            fill="none"
            stroke={segment.color}
            strokeWidth={DONUT_R_OUTER - DONUT_R_INNER}
            strokeDasharray={`${segment.arcLength * progress} ${
              DONUT_CIRCUMFERENCE - segment.arcLength * progress
            }`}
            strokeDashoffset={segment.arcOffset}
            transform="rotate(-90 50 50)"
          />
        ))}
        {segments.map((segment) => (
          <text
            key={`value-${segment.key}`}
            x={segment.countX}
            y={segment.countY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={COUNT_FONT}
            fontWeight={800}
            fill="#ffffff"
            opacity={countOpacity}
          >
            {Math.round(segment.value * progress)}
          </text>
        ))}
        {segments.map((segment) => (
          <g key={`leader-${segment.key}`} opacity={labelOpacity}>
            <line
              x1={segment.dotX}
              y1={segment.dotY}
              x2={segment.lineX}
              y2={segment.lineY}
              stroke={segment.color}
              strokeWidth={1}
              strokeLinecap="round"
            />
            <circle
              cx={segment.dotX}
              cy={segment.dotY}
              r={1.5}
              fill={segment.color}
            />
          </g>
        ))}
      </svg>

      {segments.map((segment) => (
        <div
          key={`label-${segment.key}`}
          className="absolute leading-tight font-semibold text-foreground"
          style={{
            top: `${segment.labelY}%`,
            left: `${segment.labelX}%`,
            maxWidth: `${segment.labelMaxWidth}%`,
            textAlign: segment.labelAlign,
            fontSize: LABEL_FONT,
            opacity: labelOpacity,
            transform:
              segment.labelAlign === "right"
                ? "translate(-100%, -50%)"
                : segment.labelAlign === "left"
                  ? "translateY(-50%)"
                  : "translate(-50%, -50%)",
            overflowWrap: "break-word",
            hyphens: "auto",
          }}
        >
          {segment.label}
        </div>
      ))}
    </div>
  )
}
