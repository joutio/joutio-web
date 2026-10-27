import { describe, expect, it } from "vitest"
import {
  buildTopicsPlayedChart,
  DONUT_R_OUTER,
  type TopicsPlayedDatum,
} from "./topics-played-chart"

const SAMPLE: TopicsPlayedDatum[] = [
  { key: "a", label: "Space Exploration", value: 68, color: null },
  { key: "b", label: "Jokes", value: 27, color: null },
  { key: "c", label: "Space", value: 14, color: null },
  { key: "d", label: "Physics", value: 14, color: null },
  { key: "e", label: "Frozen", value: 13, color: null },
  { key: "f", label: "DotA", value: 13, color: null },
]

describe("buildTopicsPlayedChart", () => {
  it("ordonne les parts (décroissant) et somme les fractions à 1", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    expect(chart.total).toBe(149)
    expect(chart.segments.map((s) => s.key)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ])
    const sum = chart.segments.reduce((acc, s) => acc + s.fraction, 0)
    expect(sum).toBeCloseTo(1, 6)
  })

  it("regroupe le surplus au-delà de maxSegments dans « Autres »", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, {
      otherLabel: "Autres",
      maxSegments: 3,
    })
    expect(chart.segments.map((s) => s.key)).toEqual(["a", "b", "__other__"])
    expect(chart.segments[2].label).toBe("Autres")
    expect(chart.segments[2].value).toBe(14 + 14 + 13 + 13)
  })

  it("borne les libellés dans la boîte", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    for (const segment of chart.segments) {
      expect(segment.labelY).toBeGreaterThanOrEqual(11)
      expect(segment.labelY).toBeLessThanOrEqual(89)
      expect(segment.labelX).toBeGreaterThan(0)
      expect(segment.labelX).toBeLessThan(100)
      expect(segment.labelMaxWidth).toBeGreaterThan(0)
      // Le bord **extérieur** d'un libellé latéral reste dans la boîte.
      if (segment.labelAlign === "right") {
        expect(segment.labelX - segment.labelMaxWidth).toBeGreaterThanOrEqual(0)
      }
      if (segment.labelAlign === "left") {
        expect(segment.labelX + segment.labelMaxWidth).toBeLessThanOrEqual(100)
      }
    }
  })

  it("laisse respirer l'anneau avant les libellés latéraux (jamais collés)", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    for (const segment of chart.segments) {
      if (segment.labelAlign === "center") continue
      // Libellés ancrés à 83/17, anneau à 74,5/25,5 : au moins 8 unités d'écart.
      expect(
        Math.abs(segment.labelX - 50) - DONUT_R_OUTER,
        segment.label
      ).toBeGreaterThanOrEqual(8)
    }
  })

  it("arrête le tracé d'attachement **avant** le libellé (jamais au contact)", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    for (const segment of chart.segments) {
      if (segment.zone === "right") {
        expect(
          segment.labelX - segment.lineX,
          segment.label
        ).toBeGreaterThanOrEqual(2)
      } else if (segment.zone === "left") {
        expect(
          segment.lineX - segment.labelX,
          segment.label
        ).toBeGreaterThanOrEqual(2)
      } else if (segment.zone === "top") {
        expect(
          segment.lineY - segment.labelY,
          segment.label
        ).toBeGreaterThanOrEqual(3)
      } else {
        expect(
          segment.labelY - segment.lineY,
          segment.label
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it("pose les pastilles des leaders **hors** de l'anneau", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    for (const segment of chart.segments) {
      const radius = Math.hypot(segment.dotX - 50, segment.dotY - 50)
      expect(radius, segment.label).toBeGreaterThan(DONUT_R_OUTER)
    }
  })

  it("n'affecte pas deux fois la même couleur de palette", () => {
    const chart = buildTopicsPlayedChart(SAMPLE, { otherLabel: "Autres" })
    const colors = chart.segments.map((s) => s.color)
    expect(new Set(colors).size).toBe(colors.length)
  })

  it("respecte la couleur propre d'un sujet", () => {
    const chart = buildTopicsPlayedChart(
      [{ key: "a", label: "A", value: 10, color: "#123456" }],
      { otherLabel: "Autres" }
    )
    expect(chart.segments[0].color).toBe("#123456")
  })

  it("renvoie un plan vide sans partie jouée", () => {
    const chart = buildTopicsPlayedChart([], { otherLabel: "Autres" })
    expect(chart.total).toBe(0)
    expect(chart.segments).toEqual([])
  })
})
