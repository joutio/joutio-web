import { describe, expect, it } from "vitest"
import {
  ROUND_INTRO_MS,
  SWOOSH_DURATION_MS,
  VS_DURATION_MS,
} from "../domain/game-constants"
import { planIntro } from "./intro-timing"

const FULL_BUDGET_MS = VS_DURATION_MS + SWOOSH_DURATION_MS + ROUND_INTRO_MS

describe("planIntro", () => {
  it("budget inconnu ⇒ intro complète", () => {
    expect(planIntro(null)).toEqual({
      stage: "vs",
      vsMs: VS_DURATION_MS,
      swooshMs: SWOOSH_DURATION_MS,
    })
  })

  it("client à l'heure ⇒ durées nominales", () => {
    expect(planIntro(FULL_BUDGET_MS)).toEqual({
      stage: "vs",
      vsMs: VS_DURATION_MS,
      swooshMs: SWOOSH_DURATION_MS,
    })
  })

  it("légèrement en retard ⇒ VS compressé mais conservé", () => {
    const plan = planIntro(5000)
    expect(plan.stage).toBe("vs")
    expect(plan.vsMs).toBe(5000 - ROUND_INTRO_MS - SWOOSH_DURATION_MS)
    expect(plan.swooshMs).toBe(SWOOSH_DURATION_MS)
  })

  it("retard moyen ⇒ VS sauté, swoosh compressé", () => {
    expect(planIntro(3000)).toEqual({
      stage: "swoosh",
      vsMs: 0,
      swooshMs: 3000 - ROUND_INTRO_MS,
    })
  })

  it("trop tard ⇒ done (le round va démarrer)", () => {
    expect(planIntro(ROUND_INTRO_MS)).toEqual({
      stage: "done",
      vsMs: 0,
      swooshMs: 0,
    })
    expect(planIntro(0)).toEqual({ stage: "done", vsMs: 0, swooshMs: 0 })
    expect(planIntro(-2500)).toEqual({ stage: "done", vsMs: 0, swooshMs: 0 })
  })
})
