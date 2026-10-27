// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock("@/shared/audio", () => ({
  stopChimes: vi.fn(),
  playAccumulationChime: vi.fn(),
}))
vi.mock("framer-motion", () => ({
  useReducedMotion: () => reducedMotion.value,
}))

import { playAccumulationChime } from "@/shared/audio"
import {
  REDUCED_MOTION_SALVE_MS,
  REDUCED_MOTION_TICKS,
  ringAccumulationTicks,
} from "../domain/accumulation"
import { RING_REVEAL_MS } from "../domain/game-constants"
import { useRingAccumulationSound } from "./useRingAccumulationSound"

const playAccumulationChimeMock = vi.mocked(playAccumulationChime)

describe("useRingAccumulationSound", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    reducedMotion.value = false
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("joue la salve au reveal de l'anneau, une seule fois", () => {
    const { rerender } = renderHook(
      (xp: number | null) => useRingAccumulationSound(xp),
      { initialProps: null as number | null }
    )
    expect(playAccumulationChimeMock).not.toHaveBeenCalled()

    rerender(52)
    vi.runOnlyPendingTimers()
    expect(playAccumulationChimeMock).toHaveBeenCalledWith(
      ringAccumulationTicks(52),
      RING_REVEAL_MS
    )

    // La récompense est re-livrée / re-render : pas de rejeu.
    rerender(52)
    rerender(120)
    expect(playAccumulationChimeMock).toHaveBeenCalledTimes(1)
  })

  it("joue aussi à l'ouverture directe quand la récompense est déjà projetée", () => {
    renderHook((xp: number) => useRingAccumulationSound(xp), {
      initialProps: 80,
    })
    vi.runOnlyPendingTimers()

    expect(playAccumulationChimeMock).toHaveBeenCalledWith(
      ringAccumulationTicks(80),
      RING_REVEAL_MS
    )
  })

  it("joue un motif court en prefers-reduced-motion (anneau posé d'un coup)", () => {
    reducedMotion.value = true

    renderHook((xp: number) => useRingAccumulationSound(xp), {
      initialProps: 120,
    })
    vi.runOnlyPendingTimers()

    expect(playAccumulationChimeMock).toHaveBeenCalledWith(
      REDUCED_MOTION_TICKS,
      REDUCED_MOTION_SALVE_MS
    )
  })

  it("reste muet sans récompense projetée ou pour 0 XP", () => {
    const { rerender } = renderHook(
      (xp: number | null) => useRingAccumulationSound(xp),
      { initialProps: 0 as number | null }
    )
    rerender(null)

    expect(playAccumulationChimeMock).not.toHaveBeenCalled()
  })

  it("reste muet quand les sons sont désactivés", () => {
    useSoundStore.setState({ enabled: false })

    renderHook((xp: number) => useRingAccumulationSound(xp), {
      initialProps: 120,
    })

    expect(playAccumulationChimeMock).not.toHaveBeenCalled()
  })
})
