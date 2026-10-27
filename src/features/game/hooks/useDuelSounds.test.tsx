// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"

vi.mock("@/shared/audio", () => ({
  stopChimes: vi.fn(),
  playAccumulationChime: vi.fn(),
  playCorrectChime: vi.fn(),
  playWrongChime: vi.fn(),
  playTimeoutChime: vi.fn(),
  playOpponentChime: vi.fn(),
}))

import {
  playAccumulationChime,
  playCorrectChime,
  playOpponentChime,
  playTimeoutChime,
  playWrongChime,
} from "@/shared/audio"
import {
  ARENA_ACCUMULATION_DELAY_MS,
  arenaAccumulationTicks,
} from "../domain/accumulation"
import { SCORE_REVEAL_MS } from "../domain/game-constants"
import { useDuelSounds, type DuelSoundsParams } from "./useDuelSounds"

const mocks = {
  accumulation: vi.mocked(playAccumulationChime),
  correct: vi.mocked(playCorrectChime),
  wrong: vi.mocked(playWrongChime),
  timeout: vi.mocked(playTimeoutChime),
  opponent: vi.mocked(playOpponentChime),
}

function props(overrides: Partial<DuelSoundsParams> = {}): DuelSoundsParams {
  return {
    scene: { kind: "question" },
    roundIndex: 0,
    yourCorrect: null,
    yourPick: null,
    theirPick: null,
    yourGain: 0,
    ...overrides,
  }
}

describe("useDuelSounds", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("joue le son de bonne réponse dès l'écho, une seule fois par round", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A" }))
    expect(mocks.correct).toHaveBeenCalledTimes(1)

    // La scène est re-projetée à chaque tick et l'écho peut être re-livré : pas de rejeu.
    rerender(props({ yourCorrect: true, yourPick: "A" }))
    rerender(
      props({ yourCorrect: true, yourPick: "A", scene: { kind: "reveal" } })
    )
    expect(mocks.correct).toHaveBeenCalledTimes(1)
    expect(mocks.timeout).not.toHaveBeenCalled()
  })

  it("joue le son de mauvaise réponse puis repart pour le round suivant", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: false, yourPick: "B" }))
    expect(mocks.wrong).toHaveBeenCalledTimes(1)

    rerender(props({ roundIndex: 1, scene: { kind: "roundIntro" } }))
    rerender(props({ roundIndex: 1, yourCorrect: true, yourPick: "C" }))
    expect(mocks.correct).toHaveBeenCalledTimes(1)
  })

  it("joue le son neutre au reveal quand je n'ai pas répondu", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ scene: { kind: "reveal" } }))
    expect(mocks.timeout).toHaveBeenCalledTimes(1)
  })

  it("ne sonorise jamais un état déjà terminal au montage (rechargement)", () => {
    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ yourCorrect: true, yourPick: "A" }),
    })
    expect(mocks.correct).not.toHaveBeenCalled()

    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ scene: { kind: "reveal" } }),
    })
    expect(mocks.timeout).not.toHaveBeenCalled()
  })

  it("blip l'adversaire quand sa réponse arrive en direct, une fois par round", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ theirPick: "A" }))
    expect(mocks.opponent).toHaveBeenCalledTimes(1)

    // Ticks et écho re-livré : pas de rejeu, même au reveal suivant.
    rerender(props({ theirPick: "A" }))
    rerender(props({ theirPick: "A", scene: { kind: "reveal" } }))
    expect(mocks.opponent).toHaveBeenCalledTimes(1)

    rerender(props({ roundIndex: 1 }))
    rerender(props({ roundIndex: 1, theirPick: "B" }))
    expect(mocks.opponent).toHaveBeenCalledTimes(2)
  })

  it("reste muet si l'adversaire avait déjà répondu au montage", () => {
    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ theirPick: "A" }),
    })
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("ne blip pas si l'écho adverse tombe pendant le reveal", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ scene: { kind: "reveal" }, theirPick: "A" }))
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("reste muet sur un round sans événement", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ scene: { kind: "vs" } }),
    })
    rerender(props({ scene: { kind: "question" } }))
    expect(mocks.correct).not.toHaveBeenCalled()
    expect(mocks.wrong).not.toHaveBeenCalled()
    expect(mocks.timeout).not.toHaveBeenCalled()
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("reste muet quand les sons sont désactivés", () => {
    useSoundStore.setState({ enabled: false })
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(
      props({ yourCorrect: true, yourPick: "A", theirPick: "B", yourGain: 10 })
    )
    vi.advanceTimersByTime(1000)
    expect(mocks.correct).not.toHaveBeenCalled()
    expect(mocks.opponent).not.toHaveBeenCalled()
    expect(mocks.accumulation).not.toHaveBeenCalled()
  })

  it("enchaîne la salve d'accumulation après le « ding » de bonne réponse", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A", yourGain: 20 }))

    expect(mocks.correct).toHaveBeenCalledTimes(1)
    expect(mocks.accumulation).not.toHaveBeenCalled()

    vi.advanceTimersByTime(ARENA_ACCUMULATION_DELAY_MS - 1)
    expect(mocks.accumulation).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mocks.accumulation).toHaveBeenCalledWith(
      arenaAccumulationTicks(20),
      SCORE_REVEAL_MS - ARENA_ACCUMULATION_DELAY_MS
    )
  })

  it("ne rejoue pas la salve (re-render, echo re-livré, reveal suivant)", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A", yourGain: 10 }))
    rerender(props({ yourCorrect: true, yourPick: "A", yourGain: 10 }))
    rerender(
      props({
        yourCorrect: true,
        yourPick: "A",
        yourGain: 10,
        scene: { kind: "reveal" },
      })
    )
    vi.advanceTimersByTime(1000)

    expect(mocks.accumulation).toHaveBeenCalledTimes(1)
  })

  it("accumule à nouveau au round suivant, avec le gain du round", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A", yourGain: 10 }))
    vi.advanceTimersByTime(1000)

    rerender(props({ roundIndex: 1, scene: { kind: "roundIntro" } }))
    rerender(
      props({ roundIndex: 1, yourCorrect: true, yourPick: "B", yourGain: 30 })
    )
    vi.advanceTimersByTime(1000)

    expect(mocks.accumulation).toHaveBeenNthCalledWith(
      1,
      arenaAccumulationTicks(10),
      SCORE_REVEAL_MS - ARENA_ACCUMULATION_DELAY_MS
    )
    expect(mocks.accumulation).toHaveBeenNthCalledWith(
      2,
      arenaAccumulationTicks(30),
      SCORE_REVEAL_MS - ARENA_ACCUMULATION_DELAY_MS
    )
    expect(mocks.accumulation).toHaveBeenCalledTimes(2)
  })

  it("reste muet quand la réponse est fausse (aucun point gagné)", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: false, yourPick: "B", yourGain: 0 }))
    vi.advanceTimersByTime(1000)

    expect(mocks.wrong).toHaveBeenCalledTimes(1)
    expect(mocks.accumulation).not.toHaveBeenCalled()
  })

  it("ne sonorise pas d'accumulation au rechargement (état déjà terminal)", () => {
    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ yourCorrect: true, yourPick: "A", yourGain: 20 }),
    })
    vi.advanceTimersByTime(1000)

    expect(mocks.correct).not.toHaveBeenCalled()
    expect(mocks.accumulation).not.toHaveBeenCalled()
  })

  it("annule la salve en attente si l'on quitte l'arène", () => {
    const { rerender, unmount } = renderHook(
      (p: DuelSoundsParams) => useDuelSounds(p),
      { initialProps: props() }
    )
    rerender(props({ yourCorrect: true, yourPick: "A", yourGain: 20 }))
    unmount()
    vi.advanceTimersByTime(1000)

    expect(mocks.accumulation).not.toHaveBeenCalled()
  })
})
