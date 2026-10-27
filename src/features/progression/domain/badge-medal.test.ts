import { describe, expect, it } from "vitest"
import {
  BADGE_PICTO_INK,
  BADGE_SLOT_CENTER_Y_RATIO,
  BADGE_SLOT_WIDTH_RATIO,
  badgePictoInkOf,
} from "./badge-medal"
import { BADGE_TIERS } from "./progression"

describe("géométrie du sceau de badge", () => {
  it("place le picto dans l'emplacement central des assets (104 × 104 sur 300 × 330)", () => {
    expect(BADGE_SLOT_WIDTH_RATIO).toBeCloseTo(104 / 300, 6)
    expect(BADGE_SLOT_CENTER_Y_RATIO).toBeCloseTo(150 / 330, 6)
  })
})

describe("encre du picto", () => {
  it("donne une encre sombre et distincte à chaque palier", () => {
    const inks = BADGE_TIERS.map((tier) => BADGE_PICTO_INK[tier])

    expect(new Set(inks).size).toBe(inks.length)
    for (const ink of inks) {
      // Les disques métalliques sont clairs : une encre blanche y perdrait le contraste.
      expect(ink.toLowerCase()).not.toBe("#ffffff")
    }
  })

  it("retombe sur l'encre bronze pour un palier inconnu", () => {
    expect(badgePictoInkOf("MYTHRIL")).toBe(BADGE_PICTO_INK.BRONZE)
  })
})
