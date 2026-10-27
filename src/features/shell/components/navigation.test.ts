import { describe, expect, it } from "vitest"
import { MOBILE_NAV, NAV, isNavItemActive } from "./navigation"

describe("navigation", () => {
  it("remplace Notifications par Défis dans la barre basse compacte", () => {
    expect(MOBILE_NAV.map((item) => item.id)).toEqual([
      "home",
      "topics",
      "social",
      "challenges",
      "profile",
    ])
  })

  it("garde Défis et Notifications dans la sidebar desktop", () => {
    expect(NAV.map((item) => item.id)).toEqual([
      "home",
      "topics",
      "social",
      "challenges",
      "notifications",
    ])
  })

  it("active Défis sur sa page et Social sur les fiches joueur", () => {
    const challenges = NAV.find((item) => item.id === "challenges")!
    const social = NAV.find((item) => item.id === "social")!

    expect(isNavItemActive(challenges, "/challenges")).toBe(true)
    expect(isNavItemActive(challenges, "/social")).toBe(false)
    expect(isNavItemActive(social, "/players/u1")).toBe(true)
  })
})
