import { describe, expect, it } from "vitest"
import {
  eloProgressPercent,
  eloTier,
  nextEloTier,
} from "./elo"

describe("elo", () => {
  it("démarre en Fer à 200", () => {
    expect(eloTier(200)).toBe("FER")
    expect(nextEloTier(200)?.rank).toBe("BRONZE")
  })

  it("suit les seuils des métaux", () => {
    expect(eloTier(399)).toBe("FER")
    expect(eloTier(400)).toBe("BRONZE")
    expect(eloTier(800)).toBe("OR")
    expect(eloTier(1400)).toBe("DIAMANT")
  })

  it("calcule la progression vers le palier suivant", () => {
    expect(eloProgressPercent(400)).toBe(0)
    expect(eloProgressPercent(500)).toBe(50)
    expect(eloProgressPercent(599)).toBe(100)
    expect(eloProgressPercent(1500)).toBe(100)
  })
})
