import { describe, expect, it } from "vitest"
import { isRelayout, isScrolled, nextHeaderHidden } from "./scroll-direction"

describe("isScrolled", () => {
  it("reste en surface pleine jusqu'au seuil de 8 px", () => {
    expect(isScrolled(0)).toBe(false)
    expect(isScrolled(8)).toBe(false)
    expect(isScrolled(9)).toBe(true)
  })
})

describe("nextHeaderHidden", () => {
  it("reste visible en haut de page même en descendant", () => {
    expect(nextHeaderHidden(true, { scrollTop: 0, delta: 12 })).toBe(false)
    expect(nextHeaderHidden(true, { scrollTop: 8, delta: 12 })).toBe(false)
  })

  it("se cache en descendant après le seuil", () => {
    expect(nextHeaderHidden(false, { scrollTop: 120, delta: 20 })).toBe(true)
    expect(nextHeaderHidden(false, { scrollTop: 40, delta: 20 })).toBe(false)
  })

  it("se révèle dès que l'on remonte", () => {
    expect(nextHeaderHidden(true, { scrollTop: 600, delta: -6 })).toBe(false)
  })

  it("conserve l'état sous le seuil de direction (hystérésis)", () => {
    expect(nextHeaderHidden(true, { scrollTop: 600, delta: 2 })).toBe(true)
    expect(nextHeaderHidden(false, { scrollTop: 600, delta: -2 })).toBe(false)
  })
})

describe("isRelayout", () => {
  it("détecte un contenu remis en page entre deux échantillons", () => {
    // Changement d'onglet : le contenu passe de 2000 à 700 px.
    expect(isRelayout({ scrollHeight: 700, previousScrollHeight: 2000 })).toBe(
      true
    )
    // Liste filtrée, page de résultats ajoutée, image chargée : la hauteur bouge aussi.
    expect(isRelayout({ scrollHeight: 2400, previousScrollHeight: 2000 })).toBe(
      true
    )
  })

  it("ne signale rien quand la mise en page est stable", () => {
    expect(isRelayout({ scrollHeight: 2000, previousScrollHeight: 2000 })).toBe(
      false
    )
    // Premier échantillon : aucune référence de hauteur.
    expect(isRelayout({ scrollHeight: 2000, previousScrollHeight: null })).toBe(
      false
    )
  })
})
