import { describe, expect, it } from "vitest"
import { topicGridClass } from "./topic-grid"

const AUTO_FILL = "tablet-up:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]"

describe("topicGridClass", () => {
  it("produit une grille à 3 colonnes en compact puis auto-fill", () => {
    expect(topicGridClass(3)).toContain("grid-cols-3")
    expect(topicGridClass(3)).toContain(AUTO_FILL)
    expect(topicGridClass(3)).not.toContain("grid-cols-4")
  })

  it("produit une grille à 4 colonnes en compact puis auto-fill", () => {
    expect(topicGridClass(4)).toContain("grid-cols-4")
    expect(topicGridClass(4)).toContain(AUTO_FILL)
    expect(topicGridClass(4)).not.toContain("grid-cols-3")
  })
})
