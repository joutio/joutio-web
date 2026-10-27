import { describe, expect, it } from "vitest"
import { BADGE_FAMILIES, type BadgeFamily } from "../domain/progression"
import { badgeIcon, FAMILY_ICONS, ONE_SHOT_ICONS } from "./family-icon"

describe("FAMILY_ICONS", () => {
  it("couvre chaque famille de la collection", () => {
    for (const family of BADGE_FAMILIES) {
      expect(FAMILY_ICONS[family], family).toBeDefined()
    }
    expect(Object.keys(FAMILY_ICONS)).toHaveLength(BADGE_FAMILIES.length)
  })

  it("donne un emblème **distinct** à chaque famille (plus de partage EXPLOIT/SERIES)", () => {
    const icons = Object.values(FAMILY_ICONS)
    expect(new Set(icons).size).toBe(icons.length)
  })
})

describe("ONE_SHOT_ICONS", () => {
  it("donne un emblème propre à chaque exploit ponctuel", () => {
    expect(Object.keys(ONE_SHOT_ICONS).sort()).toEqual([
      "FIRST_WIN",
      "LIGHTNING",
      "PERFECT",
      "STREAK_MASTER",
    ])
    expect(new Set(Object.values(ONE_SHOT_ICONS)).size).toBe(
      Object.keys(ONE_SHOT_ICONS).length
    )
  })

  it("n'entre pas en collision avec les emblèmes de famille", () => {
    const families = new Set(Object.values(FAMILY_ICONS))
    for (const [code, icon] of Object.entries(ONE_SHOT_ICONS)) {
      expect(families.has(icon), code).toBe(false)
    }
  })
})

describe("badgeIcon", () => {
  it("sert l'emblème de l'exploit pour un fait ponctuel", () => {
    expect(badgeIcon("LIGHTNING", "EXPLOIT")).toBe(ONE_SHOT_ICONS.LIGHTNING)
  })

  it("sert l'emblème de la famille pour une échelle", () => {
    expect(badgeIcon("SERIES_OR", "SERIES")).toBe(FAMILY_ICONS.SERIES)
  })

  it("retombe sur la famille pour un code inconnu du web", () => {
    expect(badgeIcon("NEXT_SEASON_HERO", "VICTORY")).toBe(FAMILY_ICONS.VICTORY)
  })
})

describe("union des emblèmes", () => {
  it("distingue les 17 emblèmes (13 familles + 4 exploits)", () => {
    const all = [
      ...Object.values(FAMILY_ICONS),
      ...Object.values(ONE_SHOT_ICONS),
    ]
    expect(all).toHaveLength(17)
    expect(new Set(all).size).toBe(17)
  })

  it("couvre la nouvelle famille VICTORY", () => {
    const families: BadgeFamily[] = ["VOLUME", "VICTORY"]
    expect(FAMILY_ICONS[families[0]]).not.toBe(FAMILY_ICONS[families[1]])
  })
})
