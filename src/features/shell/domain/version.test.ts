import { describe, expect, it } from "vitest"
import { isStaleBuild } from "./version"

describe("isStaleBuild", () => {
  it("détecte un build distant différent du build chargé", () => {
    expect(isStaleBuild({ buildId: "remote" }, "current")).toBe(true)
  })

  it("ignore le build courant", () => {
    expect(isStaleBuild({ buildId: "current" }, "current")).toBe(false)
  })

  it("ignore une réponse absente ou sans buildId", () => {
    expect(isStaleBuild(null, "current")).toBe(false)
    expect(isStaleBuild({ version: "1.0.0" }, "current")).toBe(false)
  })
})
