// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock("framer-motion", () => ({
  useReducedMotion: () => reducedMotion.value,
}))

import { useDonutReveal } from "./useDonutReveal"

describe("useDonutReveal", () => {
  beforeEach(() => {
    reducedMotion.value = false
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "Date",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("dessine arcs, libellés et compteurs de 0 jusqu'à l'état final", () => {
    const { result } = renderHook(() => useDonutReveal())
    expect(result.current.progress).toBe(0)
    expect(result.current.labelOpacity).toBe(0)

    // Quart de la durée (900 ms) : un quart du dessin — libellés en fondu (30 % de la tête de
    // reveal), compteurs encore absents (l'arc ne couvre pas leur milieu de part).
    act(() => {
      vi.advanceTimersByTime(225)
    })
    expect(result.current.progress).toBeCloseTo(0.25, 1)
    expect(result.current.labelOpacity).toBeGreaterThan(0.5)
    expect(result.current.labelOpacity).toBeLessThan(1)
    expect(result.current.countOpacity).toBe(0)

    // Mi-durée : libellés pleinement posés, compteurs qui commencent à se poser (0,45 → 0,75).
    act(() => {
      vi.advanceTimersByTime(225)
    })
    expect(result.current.progress).toBeCloseTo(0.5, 1)
    expect(result.current.labelOpacity).toBe(1)
    expect(result.current.countOpacity).toBeGreaterThan(0)
    expect(result.current.countOpacity).toBeLessThan(1)

    // Échéance : arcs complets, compteurs et libellés pleinement visibles.
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(result.current.progress).toBe(1)
    expect(result.current.labelOpacity).toBe(1)
    expect(result.current.countOpacity).toBe(1)
  })

  it("pose l'état final immédiatement en prefers-reduced-motion", () => {
    reducedMotion.value = true

    const { result } = renderHook(() => useDonutReveal())

    expect(result.current.progress).toBe(1)
    expect(result.current.labelOpacity).toBe(1)
    expect(result.current.countOpacity).toBe(1)
  })
})
