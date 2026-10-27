import { describe, expect, it } from "vitest"
import { useBottomNavStore } from "./useBottomNavStore"

describe("useBottomNavStore", () => {
  it("démarre avec la barre de navigation fixe", () => {
    expect(useBottomNavStore.getState().variant).toBe("fixed")
    useBottomNavStore.getState().setVariant("floating")
    expect(useBottomNavStore.getState().variant).toBe("floating")
    useBottomNavStore.getState().setVariant("fixed")
  })
})
