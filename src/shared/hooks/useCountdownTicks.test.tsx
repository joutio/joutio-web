// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"

vi.mock("@/shared/audio", () => ({
  stopChimes: vi.fn(),
  playCountdownTick: vi.fn(),
  playWaitTick: vi.fn(),
}))

import { playCountdownTick, playWaitTick } from "@/shared/audio"
import {
  COUNTDOWN_TICK_WINDOW_MS,
  deadlineEpochMs,
  nearestDeadline,
  useCountdownTicks,
} from "./useCountdownTicks"

const playCountdownTickMock = vi.mocked(playCountdownTick)
const playWaitTickMock = vi.mocked(playWaitTick)

/** Horloge contrôlée : `clock` lit `now`, que les tests avancent avec les timers factices. */
const state = vi.hoisted(() => ({ now: 0, hidden: false }))
const clock = () => state.now

const START = Date.parse("2026-06-01T10:00:00Z")
const at = (secondsFromStart: number) => START + secondsFromStart * 1000

function setHidden(hidden: boolean): void {
  state.hidden = hidden
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  })
}

/**
 * Avance horloge + timers **par petits pas** : les rappels de `setTimeout` lisent la même horloge
 * que l'affichage, un grand saut les ferait tous évaluer à l'instant final.
 */
function advance(ms: number): void {
  const step = 10
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    const chunk = Math.min(step, ms - elapsed)
    state.now += chunk
    vi.advanceTimersByTime(chunk)
  }
}

describe("useCountdownTicks", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    state.now = START
    setHidden(false)
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("tic une fois par seconde dans les dix dernières secondes, puis se tait", () => {
    renderHook(() => useCountdownTicks({ deadlineAt: at(12), clock }))

    // Hors fenêtre : rien, y compris juste avant son entrée.
    advance(1_999)
    expect(playCountdownTickMock).not.toHaveBeenCalled()

    // Entrée dans la fenêtre (10 s restantes) : un tic par seconde affichée, 10 → 0.
    advance(1)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      10,
    ])

    advance(1_000)
    expect(playCountdownTickMock).toHaveBeenLastCalledWith(9, true)

    advance(9_000)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ])
    const total = playCountdownTickMock.mock.calls.length

    // Après l'échéance : plus rien.
    advance(5_000)
    expect(playCountdownTickMock).toHaveBeenCalledTimes(total)
  })

  it("tic exactement quand la seconde affichée change (convention du compteur)", () => {
    renderHook(() => useCountdownTicks({ deadlineAt: at(3), clock }))

    // Montage à 3 000 ms : la seconde affichée passe à 2 juste après (floor), puis une par seconde.
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3,
    ])
    advance(1)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3, 2,
    ])
    advance(999)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3, 2,
    ])
    advance(1)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3, 2, 1,
    ])
  })

  it("tic sur la seconde entamée quand le compteur l'affiche (arène)", () => {
    renderHook(() =>
      useCountdownTicks({ deadlineAt: at(3), clock, displaySeconds: "ceil" })
    )

    // Convention `ceil` (chrono de manche) : la seconde 3 reste affichée 1 000 ms.
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3,
    ])
    advance(999)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3,
    ])
    advance(1)
    expect(playCountdownTickMock.mock.calls.map(([second]) => second)).toEqual([
      3, 2,
    ])
  })

  it("reste muet quand les sons sont coupés", () => {
    useSoundStore.setState({ enabled: false })

    renderHook(() => useCountdownTicks({ deadlineAt: at(3), clock }))
    advance(3_000)

    expect(playCountdownTickMock).not.toHaveBeenCalled()
  })

  it("reste muet quand l'onglet est masqué, et reprend au retour", () => {
    setHidden(true)

    renderHook(() => useCountdownTicks({ deadlineAt: at(5), clock }))
    advance(2_000)
    expect(playCountdownTickMock).not.toHaveBeenCalled()

    setHidden(false)
    advance(1_000)
    expect(playCountdownTickMock).toHaveBeenCalledWith(2, true)
  })

  it("tictaque en continu pendant l'attente (salon), puis tend vers l'expiration", () => {
    // Salon : expiration dans 1 h → la fenêtre des 10 s ne sonnerait jamais sans `continuous`.
    renderHook(() =>
      useCountdownTicks({ deadlineAt: at(3_600), clock, continuous: true })
    )

    // Tic d'attente neutre dès le montage, puis un par **frontière de seconde de l'échéance**
    // (même cadence que le compteur affiché), index croissant = alternance.
    expect(playWaitTickMock).toHaveBeenLastCalledWith(0)
    advance(1_000)
    advance(1_000)
    expect(playWaitTickMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(playCountdownTickMock).not.toHaveBeenCalled()

    // À l'entrée dans la fenêtre (10 s restantes) : tics de countdown, tension comprise.
    advance(3_600_000 - COUNTDOWN_TICK_WINDOW_MS - 2_000)
    expect(playCountdownTickMock).toHaveBeenCalledWith(10, true)
    advance(7_000)
    expect(playCountdownTickMock).toHaveBeenLastCalledWith(3, true)
  })

  it("reste muet sans échéance (ou échéance illisible)", () => {
    renderHook(() => useCountdownTicks({ deadlineAt: null, clock }))
    renderHook(() => useCountdownTicks({ deadlineAt: "pas-une-date", clock }))
    advance(20_000)

    expect(playCountdownTickMock).not.toHaveBeenCalled()
  })

  it("s'arrête au démontage", () => {
    const { unmount } = renderHook(() =>
      useCountdownTicks({ deadlineAt: at(5), clock })
    )
    // Échéance déjà dans la fenêtre : le tic part au montage, puis à chaque seconde.
    expect(playCountdownTickMock).toHaveBeenCalledTimes(1)
    advance(1_000)
    expect(playCountdownTickMock).toHaveBeenCalledTimes(2)

    unmount()
    advance(5_000)
    expect(playCountdownTickMock).toHaveBeenCalledTimes(2)
  })

  it("amorce un long countdown sans tic avant la fenêtre", () => {
    // TTL d'un défi (1 h) : rien tant que la fenêtre des 10 dernières secondes n'est pas ouverte.
    renderHook(() => useCountdownTicks({ deadlineAt: at(3_600), clock }))
    advance(3_600_000 - COUNTDOWN_TICK_WINDOW_MS - 1)
    expect(playCountdownTickMock).not.toHaveBeenCalled()

    advance(1)
    expect(playCountdownTickMock).toHaveBeenCalledWith(10, true)
  })

  it("garde une hauteur constante pour l'appariement (sans tension)", () => {
    renderHook(() =>
      useCountdownTicks({ deadlineAt: at(5), clock, tense: false })
    )

    advance(1_000)
    expect(playCountdownTickMock).toHaveBeenLastCalledWith(4, false)
    advance(3_000)
    expect(playCountdownTickMock).toHaveBeenLastCalledWith(1, false)
  })
})

describe("deadlineEpochMs / nearestDeadline", () => {
  it("normalise les échéances (epoch, ISO serveur, Date) et ignore l'illisible", () => {
    expect(deadlineEpochMs(START)).toBe(START)
    expect(deadlineEpochMs("2026-06-01T10:00:00Z")).toBe(START)
    expect(deadlineEpochMs(new Date(START))).toBe(START)
    expect(deadlineEpochMs("nope")).toBeNull()
    expect(deadlineEpochMs(null)).toBeNull()
    expect(deadlineEpochMs(undefined)).toBeNull()
  })

  it("retient l'échéance la plus proche (une seule source de tic-tac par écran)", () => {
    expect(
      nearestDeadline(["2026-06-01T11:00:00Z", "2026-06-01T10:00:05Z", null])
    ).toBe(START + 5_000)
    expect(nearestDeadline([])).toBeNull()
    expect(nearestDeadline([null, "nope"])).toBeNull()
  })
})
