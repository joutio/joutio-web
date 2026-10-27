// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock("framer-motion", () => ({
  useReducedMotion: () => reducedMotion.value,
}))

import { useRingReveal } from "./useRingReveal"

describe("useRingReveal", () => {
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

  it("anime la progression et le compteur de 0 jusqu'à leur cible", () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useRingReveal(20, 54, enabled),
      { initialProps: { enabled: false } }
    )
    expect(result.current.percent).toBe(0)
    expect(result.current.gained).toBe(0)

    rerender({ enabled: true })

    // Quart de la durée (1,6 s) : progression **linéaire** — un quart du remplissage.
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.percent).toBeCloseTo(20 * 0.25, 0)

    // Mi-durée et au-delà : la montée s'installe et les valeurs sont pleinement visibles.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.percent).toBeGreaterThan(20 * 0.25)
    expect(result.current.percent).toBeLessThan(20)
    expect(result.current.gained).toBeGreaterThan(0)
    expect(result.current.gained).toBeLessThan(54)
    expect(result.current.valueOpacity).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1_600)
    })
    expect(result.current.percent).toBeCloseTo(20)
    expect(result.current.gained).toBe(54)
  })

  it("pose l'état final immédiatement en prefers-reduced-motion", () => {
    reducedMotion.value = true

    const { result } = renderHook(() => useRingReveal(20, 54, true))

    expect(result.current.percent).toBe(20)
    expect(result.current.gained).toBe(54)
    expect(result.current.valueOpacity).toBe(1)
  })

  it("reste à 0 en prefers-reduced-motion tant que l'ouverture n'est pas terminée", () => {
    reducedMotion.value = true

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useRingReveal(20, 54, enabled),
      { initialProps: { enabled: false } }
    )
    expect(result.current.percent).toBe(0)
    expect(result.current.gained).toBe(0)

    rerender({ enabled: true })
    expect(result.current.percent).toBe(20)
    expect(result.current.gained).toBe(54)
  })

  it("reste à 0 tant que la récompense n'est pas disponible", () => {
    const { result } = renderHook(() => useRingReveal(20, 54, false))
    vi.advanceTimersByTime(2000)

    expect(result.current.percent).toBe(0)
    expect(result.current.gained).toBe(0)
  })
})
