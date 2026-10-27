import { describe, expect, it } from "vitest"
import { categoryColor, categoryTextColor } from "./categories"

describe("categoryTextColor", () => {
  it("mélange la couleur éditoriale avec le texte du thème", () => {
    expect(categoryTextColor("TELEVISION")).toBe(
      "color-mix(in oklab, #f59e0b 70%, var(--foreground))"
    )
  })

  it("retombe sur la couleur générique pour une catégorie inconnue", () => {
    expect(categoryColor("UNKNOWN")).toBe("#8b5cf6")
    expect(categoryTextColor("UNKNOWN")).toContain("#8b5cf6")
  })
})
