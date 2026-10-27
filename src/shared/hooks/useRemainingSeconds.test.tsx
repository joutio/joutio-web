// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { remainingSeconds, useRemainingSeconds } from "./useRemainingSeconds"

describe("remainingSeconds", () => {
  it("arrondit au supérieur et borne à zéro", () => {
    const now = Date.parse("2026-01-01T10:00:00Z")
    expect(remainingSeconds("2026-01-01T10:00:05Z", now)).toBe(5)
    expect(remainingSeconds("2026-01-01T10:00:05.001Z", now)).toBe(6)
    expect(remainingSeconds("2026-01-01T09:59:00Z", now)).toBe(0)
    expect(remainingSeconds(null, now)).toBe(0)
  })

  it("se rafraîchit avec l'horloge fournie", () => {
    vi.useFakeTimers()
    try {
      const deadline = "2026-01-01T10:00:05Z"
      let now = Date.parse("2026-01-01T10:00:00Z")
      const clock = () => now

      const { result } = renderHook(() => useRemainingSeconds(deadline, clock))
      expect(result.current).toBe(5)

      now += 1_000
      act(() => {
        vi.advanceTimersByTime(250)
      })
      expect(result.current).toBe(4)
    } finally {
      vi.useRealTimers()
    }
  })
})
