import { afterEach, describe, expect, it, vi } from "vitest"
import { clearReturnTo, readReturnTo, rememberReturnTo } from "./return-to"

describe("returnTo", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retourne null hors navigateur (node)", () => {
    expect(readReturnTo()).toBeNull()
  })

  it("mémorise puis efface la cible", () => {
    const store = new Map<string, string>()
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    })

    rememberReturnTo("/join/room-1")
    expect(readReturnTo()).toBe("/join/room-1")

    clearReturnTo()
    expect(readReturnTo()).toBeNull()
  })
})
