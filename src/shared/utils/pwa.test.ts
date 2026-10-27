import { afterEach, describe, expect, it, vi } from "vitest"
import { isIos, isStandalone, shouldOfferInstall } from "./pwa"

describe("pwa", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("isStandalone est faux hors navigateur (node)", () => {
    expect(isStandalone()).toBe(false)
  })

  it("détecte iOS", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
    })

    expect(isIos()).toBe(true)
  })

  it("ne confond pas Chrome avec iOS", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
    })

    expect(isIos()).toBe(false)
  })
})

describe("shouldOfferInstall", () => {
  it("affiche la section quand un bouton natif est disponible", () => {
    expect(
      shouldOfferInstall({ installed: false, canInstall: true, ios: false })
    ).toBe(true)
  })

  it("affiche les consignes iOS tant que l'app n'est pas installée", () => {
    expect(
      shouldOfferInstall({ installed: false, canInstall: false, ios: true })
    ).toBe(true)
  })

  it("masque la section si l'app est installée", () => {
    expect(
      shouldOfferInstall({ installed: true, canInstall: true, ios: true })
    ).toBe(false)
  })

  it("masque la section si l'installation est impossible (Firefox, Safari macOS…)", () => {
    expect(
      shouldOfferInstall({ installed: false, canInstall: false, ios: false })
    ).toBe(false)
  })
})
