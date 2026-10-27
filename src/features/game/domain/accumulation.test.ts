import { describe, expect, it } from "vitest"
import {
  ACCUMULATION_MIN_TICKS,
  ARENA_ACCUMULATION_DELAY_MS,
  ARENA_ACCUMULATION_MAX_TICKS,
  REDUCED_MOTION_TICKS,
  RING_ACCUMULATION_MAX_TICKS,
  accumulationTicks,
  arenaAccumulationTicks,
  ringAccumulationTicks,
} from "./accumulation"
import {
  ANSWER_REVEAL_STAGGER_MS,
  RING_REVEAL_MS,
  SCORE_REVEAL_MS,
} from "./game-constants"

describe("accumulation", () => {
  it("ne sonne rien sans gain (mauvaise réponse, montant nul ou invalide)", () => {
    expect(accumulationTicks(0, 3, 8)).toBe(0)
    expect(accumulationTicks(-10, 3, 8)).toBe(0)
    expect(accumulationTicks(Number.NaN, 3, 8)).toBe(0)
    expect(arenaAccumulationTicks(0)).toBe(0)
    expect(ringAccumulationTicks(0)).toBe(0)
  })

  it("borne le nombre de ticks : minimum audible, maximum par usage", () => {
    expect(accumulationTicks(1, 3, 8)).toBe(ACCUMULATION_MIN_TICKS)
    expect(arenaAccumulationTicks(1000)).toBe(ARENA_ACCUMULATION_MAX_TICKS)
    expect(ringAccumulationTicks(1000)).toBe(RING_ACCUMULATION_MAX_TICKS)
  })

  it("suit le barème de l'arène (10–20 pts, 20–40 en question bonus)", () => {
    expect(arenaAccumulationTicks(10)).toBe(5)
    expect(arenaAccumulationTicks(15)).toBe(8)
    expect(arenaAccumulationTicks(20)).toBe(10)
    expect(arenaAccumulationTicks(40)).toBe(ARENA_ACCUMULATION_MAX_TICKS)
    // Le petit gain (base seule, réponse lente) reste bien au-dessus du minimum.
    expect(arenaAccumulationTicks(10)).toBeGreaterThan(ACCUMULATION_MIN_TICKS)
  })

  it("suit l'XP gagnée sur le duel (anneau de maîtrise)", () => {
    expect(ringAccumulationTicks(8)).toBe(ACCUMULATION_MIN_TICKS)
    expect(ringAccumulationTicks(40)).toBe(7)
    expect(ringAccumulationTicks(96)).toBe(16)
    expect(ringAccumulationTicks(400)).toBe(RING_ACCUMULATION_MAX_TICKS)
  })

  it("étale la salve sur l'animation correspondante (jauge 0,9 s, anneau 1,6 s)", () => {
    // Salve maximale de l'arène : 12 ticks × 70 ms ≈ 0,84 s pour une jauge de 0,9 s.
    expect(ARENA_ACCUMULATION_MAX_TICKS * 70).toBeGreaterThan(
      SCORE_REVEAL_MS * 0.8
    )
    expect(ARENA_ACCUMULATION_MAX_TICKS * 70).toBeLessThanOrEqual(
      SCORE_REVEAL_MS
    )
    // Salve maximale de l'anneau : 22 ticks × 70 ms ≈ 1,54 s pour un reveal de 1,6 s.
    expect(RING_ACCUMULATION_MAX_TICKS * 70).toBeGreaterThan(
      RING_REVEAL_MS * 0.9
    )
    expect(RING_ACCUMULATION_MAX_TICKS * 70).toBeLessThanOrEqual(RING_REVEAL_MS)
  })

  it("décale la salve de l'arène après le son de bonne réponse", () => {
    expect(ARENA_ACCUMULATION_DELAY_MS).toBe(ANSWER_REVEAL_STAGGER_MS)
    expect(ARENA_ACCUMULATION_DELAY_MS).toBeGreaterThan(0)
  })

  it("prévoit un motif court quand l'animation est neutralisée", () => {
    expect(REDUCED_MOTION_TICKS).toBe(ACCUMULATION_MIN_TICKS)
  })
})
