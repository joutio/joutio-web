import { describe, expect, it } from "vitest"
import { categoryColor, categoryTextColor } from "./categories"

describe("categoryTextColor", () => {
  it("mélange la couleur éditoriale avec le texte du thème", () => {
    expect(categoryTextColor("TELEVISION")).toBe(
      "color-mix(in oklab, #EC93A8 60%, var(--foreground))"
    )
  })

  it("retombe sur la couleur générique pour une catégorie inconnue", () => {
    expect(categoryColor("UNKNOWN")).toBe("#B1B1B1")
    expect(categoryTextColor("UNKNOWN")).toContain("#B1B1B1")
  })
})
