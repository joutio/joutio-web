/**
 * Géométrie pure du donut « Sujets joués » (page profil) : anneau de parts, compteurs au centre
 * de chaque part et libellés extérieurs reliés par un tracé pointé — à l'image de
 * `product/images/img_9.png`. Aucune dépendance React : le composant ne fait que rendre le plan
 * calculé ici (parts, positions des compteurs, ancre des libellés).
 */

/** Palette de repli (couleurs éditoriales des catégories) quand un sujet n'a pas de couleur. */
export const TOPIC_DONUT_PALETTE = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#22c55e", // vert
  "#eab308", // jaune
  "#f97316", // orange
  "#ef4444", // rouge
] as const

/** Couleur neutre du regroupement « Autres ». */
export const TOPIC_DONUT_OTHER_COLOR = "#94a3b8"

/* Géométrie exprimée dans une boîte carrée de 100 × 100 unités (le viewBox du SVG). */
export const DONUT_R_OUTER = 24.5
export const DONUT_R_INNER = 14.7
export const DONUT_R_MID = (DONUT_R_OUTER + DONUT_R_INNER) / 2
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R_MID
/** Durée du reveal à l'ouverture de l'onglet (même famille de rythme que les jauges/anneaux). */
export const DONUT_REVEAL_MS = 900
/** Écart entre deux parts (unités). */
const SEGMENT_GAP = 1.3
/**
 * Colonnes latérales (bord intérieur du libellé) — ancrées à **83/17** : l'anneau s'arrête à
 * 74,5/25,5, il reste donc ~8,5 unités de respiration avant les libellés, que le tracé
 * d'attachement traverse de bout en bout.
 */
const LABEL_RIGHT_X = 83
const LABEL_LEFT_X = 17
/** Espace entre la fin du tracé d'attachement et le libellé (unités) — jamais collés. */
const LEADER_GAP = 2.5
/** Demi-hauteur de texte (unités) : pour haut/bas, le tracé part du centre du libellé. */
const LEADER_TEXT_HALF = 2
/** Largeur maximale d'un libellé latéral (le bord extérieur reste dans la boîte). */
const LABEL_SIDE_WIDTH = 17
/** Libellés haut / bas : centrés, au-dessus / en dessous de l'anneau. */
const LABEL_TOP_Y = 11
const LABEL_BOTTOM_Y = 89
/** Écart vertical minimal entre deux libellés d'une même colonne. */
const LABEL_GAP = 9
const LABEL_GAP_LONG = 12

export interface TopicsPlayedDatum {
  key: string
  label: string
  value: number
  color: string | null
}

export interface TopicsPlayedChartOptions {
  /** Nombre de parts affichées (le surplus est regroupé dans « Autres »). */
  maxSegments?: number
  /** Part minimale : en dessous, le sujet rejoint « Autres ». */
  minShare?: number
  otherLabel: string
}

export type DonutZone = "top" | "right" | "bottom" | "left"

export interface TopicDonutSegment {
  key: string
  label: string
  value: number
  color: string
  /** Part du total (0–1). */
  fraction: number
  /** Cumul des parts précédentes (0–1). */
  startFraction: number
  /** Angle médian, en degrés depuis le sommet, horaire. */
  midAngle: number
  zone: DonutZone
  /* Rendu (unités 100 × 100). */
  arcLength: number
  arcOffset: number
  countX: number
  countY: number
  dotX: number
  dotY: number
  lineX: number
  lineY: number
  labelX: number
  labelY: number
  labelMaxWidth: number
  labelAlign: "left" | "right" | "center"
}

export interface TopicsPlayedChart {
  total: number
  segments: TopicDonutSegment[]
}

function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  return { x: 50 + radius * Math.sin(a), y: 50 - radius * Math.cos(a) }
}

/** Zone du libellé : colonnes latérales, ou centré au-dessus / en dessous de l'anneau. */
function zoneOf(midAngle: number): DonutZone {
  if (midAngle <= 40 || midAngle >= 320) return "top"
  if (midAngle < 140) return "right"
  if (midAngle <= 220) return "bottom"
  return "left"
}

/**
 * Regroupe les parts (surplus au-delà de `maxSegments` et sujets sous `minShare`), les ordonne
 * (décroissant), leur affecte une couleur (celle du sujet, sinon la palette), puis place les
 * compteurs et les libellés (anti-chevauchement vertical par colonne, répartition horizontale
 * en haut / en bas).
 */
export function buildTopicsPlayedChart(
  data: TopicsPlayedDatum[],
  options: TopicsPlayedChartOptions
): TopicsPlayedChart {
  const maxSegments = options.maxSegments ?? 6
  const minShare = options.minShare ?? 0.02
  const played = data.filter((d) => d.value > 0)
  const total = played.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0) return { total: 0, segments: [] }

  const sorted = [...played].sort((a, b) => b.value - a.value)
  const byCount = sorted.length > maxSegments
  const kept: TopicsPlayedDatum[] = []
  let other = 0
  sorted.forEach((d, index) => {
    const isOther = byCount
      ? index >= maxSegments - 1
      : d.value / total < minShare
    if (isOther) other += d.value
    else kept.push(d)
  })
  if (other > 0) {
    kept.push({
      key: "__other__",
      label: options.otherLabel,
      value: other,
      color: TOPIC_DONUT_OTHER_COLOR,
    })
  }

  const segments: TopicDonutSegment[] = []
  let startFraction = 0
  let colorIndex = 0
  for (const d of kept) {
    const fraction = d.value / total
    const midAngle = (startFraction + fraction / 2) * 360
    const explicitColor = d.color?.trim()
    const color =
      explicitColor ||
      (d.key === "__other__"
        ? TOPIC_DONUT_OTHER_COLOR
        : TOPIC_DONUT_PALETTE[colorIndex++ % TOPIC_DONUT_PALETTE.length])
    const count = polar(DONUT_R_MID, midAngle)
    const dot = polar(DONUT_R_OUTER + 0.8, midAngle)
    segments.push({
      key: d.key,
      label: d.label,
      value: d.value,
      color,
      fraction,
      startFraction,
      midAngle,
      zone: zoneOf(midAngle),
      arcLength: Math.max(0, fraction * DONUT_CIRCUMFERENCE - SEGMENT_GAP),
      arcOffset: -(startFraction * DONUT_CIRCUMFERENCE + SEGMENT_GAP / 2),
      countX: count.x,
      countY: count.y,
      dotX: dot.x,
      dotY: dot.y,
      lineX: dot.x,
      lineY: dot.y,
      labelX: 0,
      labelY: 0,
      labelMaxWidth: 0,
      labelAlign: "center",
    })
    startFraction += fraction
  }

  placeLabels(segments)
  return { total, segments }
}

/** Positionne les libellés (colonnes latérales anti-chevauchement, haut/bas répartis). */
function placeLabels(segments: TopicDonutSegment[]): void {
  const byZone: Record<DonutZone, TopicDonutSegment[]> = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  }
  for (const segment of segments) byZone[segment.zone].push(segment)

  for (const side of ["left", "right"] as const) {
    const column = byZone[side]
    const x = side === "right" ? LABEL_RIGHT_X : LABEL_LEFT_X
    for (const segment of column) {
      segment.labelX = x
      segment.labelAlign = side === "right" ? "left" : "right"
      segment.labelMaxWidth = LABEL_SIDE_WIDTH
      segment.labelY = clamp(
        50 - DONUT_R_OUTER * Math.cos((segment.midAngle * Math.PI) / 180),
        12,
        88
      )
    }
    column.sort((a, b) => a.labelY - b.labelY)
    for (let i = 1; i < column.length; i++) {
      const gap = column[i].label.length > 12 ? LABEL_GAP_LONG : LABEL_GAP
      column[i].labelY = Math.max(column[i].labelY, column[i - 1].labelY + gap)
    }
    distribute(column, 88)
  }

  for (const zone of ["top", "bottom"] as const) {
    const row = byZone[zone].sort((a, b) => a.midAngle - b.midAngle)
    const count = row.length
    const step = count > 1 ? Math.min(36, 72 / (count - 1)) : 0
    row.forEach((segment, index) => {
      segment.labelX = clamp(
        count === 1 ? 50 : 50 + (index - (count - 1) / 2) * step,
        12,
        88
      )
      segment.labelY = zone === "top" ? LABEL_TOP_Y : LABEL_BOTTOM_Y
      segment.labelAlign = "center"
      segment.labelMaxWidth = count === 1 ? 44 : 32
    })
  }

  // Fin du tracé d'attachement : arrêtée à `LEADER_GAP` du bord du libellé — jamais au contact du
  // texte (au-dessus / en dessous pour haut/bas, où le centre du libellé sert de repère).
  for (const segment of segments) {
    if (segment.zone === "right") {
      segment.lineX = LABEL_RIGHT_X - LEADER_GAP
      segment.lineY = segment.labelY
    } else if (segment.zone === "left") {
      segment.lineX = LABEL_LEFT_X + LEADER_GAP
      segment.lineY = segment.labelY
    } else {
      segment.lineX = segment.labelX
      segment.lineY =
        segment.zone === "top"
          ? segment.labelY + LEADER_GAP + LEADER_TEXT_HALF
          : segment.labelY - LEADER_GAP - LEADER_TEXT_HALF
    }
  }
}

/** Recadre une colonne pour rester dans la boîte (12–88). */
function distribute(column: TopicDonutSegment[], max: number): void {
  if (column.length === 0) return
  const overflow = column[column.length - 1].labelY - max
  if (overflow > 0) {
    for (const segment of column) segment.labelY -= overflow
  }
  if (column[0].labelY < 12) {
    const shift = 12 - column[0].labelY
    for (const segment of column) segment.labelY += shift
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
