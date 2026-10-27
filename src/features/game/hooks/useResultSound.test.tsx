// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import type { DuelResultOutcome } from "@/shared/audio"

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock("@/shared/audio", () => ({
  stopChimes: vi.fn(),
  playResultChime: vi.fn(),
}))
vi.mock("framer-motion", () => ({
  useReducedMotion: () => reducedMotion.value,
}))

import { playResultChime } from "@/shared/audio"
import { useResultSound } from "./useResultSound"

const playResultChimeMock = vi.mocked(playResultChime)

describe("useResultSound", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    reducedMotion.value = false
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("joue le son du bilan dès que le bilan est disponible, une seule fois", () => {
    const { rerender } = renderHook(
      (outcome: DuelResultOutcome | null) => useResultSound(outcome),
      { initialProps: null as DuelResultOutcome | null }
    )
    expect(playResultChimeMock).not.toHaveBeenCalled()

    rerender("win")
    expect(playResultChimeMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(playResultChimeMock).toHaveBeenCalledWith("win")

    rerender("win")
    rerender("draw")
    vi.advanceTimersByTime(1000)
    expect(playResultChimeMock).toHaveBeenCalledTimes(1)
  })

  it("joue immédiatement en prefers-reduced-motion (animation neutralisée)", () => {
    reducedMotion.value = true

    renderHook((outcome: DuelResultOutcome) => useResultSound(outcome), {
      initialProps: "win",
    })
    vi.advanceTimersByTime(1)

    expect(playResultChimeMock).toHaveBeenCalledWith("win")
  })

  it("annule le son si l'on quitte la page avant la fin de l'animation", () => {
    const { rerender, unmount } = renderHook(
      (outcome: DuelResultOutcome | null) => useResultSound(outcome),
      { initialProps: null as DuelResultOutcome | null }
    )
    rerender("win")
    unmount()
    vi.advanceTimersByTime(1000)

    expect(playResultChimeMock).not.toHaveBeenCalled()
  })

  it("reste muet pour une partie sans issue sportive (annulée)", () => {
    renderHook((outcome: DuelResultOutcome | null) => useResultSound(outcome), {
      initialProps: null,
    })
    vi.advanceTimersByTime(1000)

    expect(playResultChimeMock).not.toHaveBeenCalled()
  })

  it("reste muet quand les sons sont désactivés", () => {
    useSoundStore.setState({ enabled: false })
    renderHook((outcome: DuelResultOutcome) => useResultSound(outcome), {
      initialProps: "win",
    })
    vi.advanceTimersByTime(1000)

    expect(playResultChimeMock).not.toHaveBeenCalled()
  })
})
