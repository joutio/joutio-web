import { describe, expect, it } from "vitest"
import { useTopicGridStore } from "./useTopicGridStore"

describe("useTopicGridStore", () => {
  it("démarre à 3 colonnes et accepte le passage à 4", () => {
    expect(useTopicGridStore.getState().columns).toBe(3)
    useTopicGridStore.getState().setColumns(4)
    expect(useTopicGridStore.getState().columns).toBe(4)
    useTopicGridStore.getState().setColumns(3)
  })
})
