import { describe, expect, it } from "vitest"
import { NOTIFICATION_CHIME } from "./chimes"
import { playChime, stopChimes } from "./engine"

describe("playChime", () => {
  it("ne casse pas si l'API Web Audio est indisponible", () => {
    expect(() => playChime(NOTIFICATION_CHIME)).not.toThrow()
  })

  it("coupe sans casser quand il n'y a rien à couper", () => {
    expect(() => stopChimes()).not.toThrow()
    expect(() => stopChimes()).not.toThrow()
  })
})
