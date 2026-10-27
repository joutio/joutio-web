import { describe, expect, it } from "vitest"
import { hasWinLossResults, winLossSegments } from "./win-loss"

describe("hasWinLossResults", () => {
  it("est faux sans aucun résultat", () => {
    expect(hasWinLossResults({ wins: 0, draws: 0, losses: 0 })).toBe(false)
    expect(hasWinLossResults({ wins: 1, draws: 0, losses: 0 })).toBe(true)
  })
})

describe("winLossSegments", () => {
  it("ne garde que les issues non nulles", () => {
    const segments = winLossSegments({ wins: 0, draws: 0, losses: 4 })

    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({
      key: "losses",
      label: "Défaites",
      percent: 100,
    })
  })

  it("calcule des pourcentages sur le total et écarte les zéros", () => {
    const segments = winLossSegments({ wins: 3, draws: 0, losses: 1 })

    expect(segments.map((s) => [s.key, s.percent])).toEqual([
      ["wins", 75],
      ["losses", 25],
    ])
  })

  it("retourne une liste vide sans résultat", () => {
    expect(winLossSegments({ wins: 0, draws: 0, losses: 0 })).toEqual([])
  })
})
