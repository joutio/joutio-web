import { beforeEach, describe, expect, it } from "vitest"
import type { Achievement } from "../domain/achievement"
import { useAchievementStore } from "./useAchievementStore"

function badge(code: string): Achievement {
  return {
    kind: "BADGE",
    code,
    label: "Mythe vivant",
    family: "VOLUME",
    tier: "DIAMANT",
    at: "2026-10-15T18:00:00Z",
  }
}

describe("useAchievementStore", () => {
  beforeEach(() => useAchievementStore.setState({ queue: [] }))

  it("met les déblocages en file dans l'ordre d'arrivée", () => {
    useAchievementStore.getState().enqueue(badge("DUELIST_BRONZE"))
    useAchievementStore.getState().enqueue(badge("PERFECT"))

    expect(
      useAchievementStore.getState().queue.map((item) => item.code)
    ).toEqual(["DUELIST_BRONZE", "PERFECT"])
  })

  it("ignore un déblocage déjà en file (rediffusion STOMP à la reconnexion)", () => {
    useAchievementStore.getState().enqueue(badge("DUELIST_BRONZE"))
    useAchievementStore.getState().enqueue(badge("DUELIST_BRONZE"))

    expect(useAchievementStore.getState().queue).toHaveLength(1)
  })

  it("passe au suivant puis se vide", () => {
    useAchievementStore.getState().enqueue(badge("DUELIST_BRONZE"))
    useAchievementStore.getState().enqueue(badge("PERFECT"))

    useAchievementStore.getState().dismiss()
    expect(
      useAchievementStore.getState().queue.map((item) => item.kind)
    ).toEqual(["BADGE"])

    useAchievementStore.getState().dismiss()
    expect(useAchievementStore.getState().queue).toEqual([])
  })

  it("se vide à la déconnexion", () => {
    useAchievementStore.getState().enqueue(badge("PERFECT"))
    useAchievementStore.getState().clear()

    expect(useAchievementStore.getState().queue).toEqual([])
  })
})
