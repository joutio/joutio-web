import { describe, expect, it } from "vitest"
import {
  RIBBON_INK,
  RIBBON_TITLE_FONT,
  RIBBON_TITLE_MAX_WIDTH,
  RIBBON_TITLE_MIN_SIZE,
  RIBBON_TITLE_SIZE,
  RIBBON_VIEWBOX,
  estimateRibbonTitleWidth,
  fitRibbonTitle,
} from "./ribbon"

describe("fitRibbonTitle", () => {
  it("ne touche pas un titre qui tient dans le bandeau (jamais d'étirement)", () => {
    expect(fitRibbonTitle(320, "Historien")).toEqual({
      fontSize: RIBBON_TITLE_SIZE,
      textLength: null,
    })
    expect(fitRibbonTitle(null, "Fer")).toEqual({
      fontSize: RIBBON_TITLE_SIZE,
      textLength: null,
    })
  })

  it("réduit le corps proportionnellement quand le titre dépasse la largeur utile", () => {
    // Mesure à ~1,3× la largeur utile ⇒ corps réduit d'autant, sans compression.
    const fit = fitRibbonTitle(700, "Or · Harry Potter")
    expect(fit.fontSize).toBeLessThan(RIBBON_TITLE_SIZE)
    expect(fit.fontSize).toBeGreaterThan(RIBBON_TITLE_MIN_SIZE)
    expect(fit.textLength).toBeNull()
  })

  it("plancher de corps puis compression pour un libellé démesuré", () => {
    const fit = fitRibbonTitle(
      4000,
      "Diamant · Les plus grands mystères non résolus"
    )
    expect(fit.fontSize).toBe(RIBBON_TITLE_MIN_SIZE)
    expect(fit.textLength).toBe(RIBBON_TITLE_MAX_WIDTH)
  })

  it("estime la largeur d'un libellé sans mesure (premier rendu)", () => {
    expect(estimateRibbonTitleWidth("Fer")).toBeCloseTo(
      3 * RIBBON_TITLE_SIZE * 0.51
    )
    // Estimation seule (mesure indisponible) : un libellé long passe au plancher puis compresse.
    const fit = fitRibbonTitle(null, "Or · Les plus grands mystères")
    expect(fit.fontSize).toBe(RIBBON_TITLE_MIN_SIZE)
    expect(fit.textLength).toBe(RIBBON_TITLE_MAX_WIDTH)
  })
})

describe("repère du ruban", () => {
  it("partage le viewBox et les encres des sept assets de rang", () => {
    expect(RIBBON_VIEWBOX).toBe("0 0 940 240")
    expect(Object.keys(RIBBON_INK)).toHaveLength(7)
    expect(new Set(Object.values(RIBBON_INK).map((ink) => ink.fill)).size).toBe(
      7
    )
  })

  it("compose le titre dans la police d'interface", () => {
    expect(RIBBON_TITLE_FONT).toContain("'Geist Variable'")
    expect(RIBBON_TITLE_FONT).toContain("sans-serif")
  })
})
