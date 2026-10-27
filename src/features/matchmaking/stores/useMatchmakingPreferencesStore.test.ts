import { describe, expect, it } from "vitest"
import { useMatchmakingPreferencesStore } from "./useMatchmakingPreferencesStore"

describe("useMatchmakingPreferencesStore", () => {
  it("active le repli bot automatique par défaut", () => {
    expect(useMatchmakingPreferencesStore.getState().autoTrainOnTimeout).toBe(
      true
    )

    useMatchmakingPreferencesStore.getState().setAutoTrainOnTimeout(false)
    expect(useMatchmakingPreferencesStore.getState().autoTrainOnTimeout).toBe(
      false
    )

    useMatchmakingPreferencesStore.getState().setAutoTrainOnTimeout(true)
  })
})
