// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import type { Room } from "../domain/room"
import { emptyRoom } from "../domain/room"

const INITIATOR = "initiator-1"
const OPPONENT = "opponent-1"

/** Horloge serveur contrôlée : les tests avancent `state.now`. */
const state = vi.hoisted(() => ({ now: 0 }))

vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({
    serverNow: () => state.now,
    synced: true,
    resync: vi.fn(),
  }),
}))

vi.mock("@/shared/audio", () => ({
  playNotificationChime: vi.fn(),
}))

vi.mock("@/shared/utils/nudge", () => ({
  triggerScreenNudge: vi.fn(),
}))

vi.mock("@/features/auth", () => ({
  getSessionUserId: () => "initiator-1",
}))

vi.mock("../lib/rooms", () => ({
  roomsService: { wizz: vi.fn() },
}))

import { playNotificationChime } from "@/shared/audio"
import { triggerScreenNudge } from "@/shared/utils/nudge"
import { roomsService } from "../lib/rooms"
import { useRoomWizz } from "./useWizz"

const playNotificationChimeMock = vi.mocked(playNotificationChime)
const triggerScreenNudgeMock = vi.mocked(triggerScreenNudge)
const wizzMock = vi.mocked(roomsService.wizz)

const NOW = Date.parse("2026-06-01T10:00:00Z")

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function nominalWaitingRoom(): Room {
  return {
    ...emptyRoom("room-1"),
    topicId: "topic-1",
    initiatorId: INITIATOR,
    opponentId: OPPONENT,
    initiatorPresent: true,
  }
}

describe("useRoomWizz", () => {
  beforeEach(() => {
    state.now = NOW
    wizzMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("est disponible quand l'adversaire nommé est absent", () => {
    const { result } = renderHook(
      () => useRoomWizz(nominalWaitingRoom(), "room-1"),
      { wrapper }
    )

    expect(result.current.available).toBe(true)
    expect(result.current.cooldownSeconds).toBe(0)
  })

  it("envoie la relance avec secousse et son, puis grise le bouton (cadence optimiste)", async () => {
    const { result } = renderHook(
      () => useRoomWizz(nominalWaitingRoom(), "room-1"),
      { wrapper }
    )

    await act(async () => {
      result.current.send()
    })

    expect(wizzMock).toHaveBeenCalledWith("room-1")
    expect(triggerScreenNudgeMock).toHaveBeenCalled()
    expect(playNotificationChimeMock).toHaveBeenCalledWith("WIZZ")

    // La cadence est posée dès l'envoi (le fold la reprend à la trame ROOM_WIZZED).
    await waitFor(() => expect(result.current.available).toBe(false))
    expect(result.current.cooldownSeconds).toBeGreaterThan(0)
  })

  it("libère le bouton à la fin de la cadence", async () => {
    const { result } = renderHook(
      () => useRoomWizz(nominalWaitingRoom(), "room-1"),
      { wrapper }
    )

    await act(async () => {
      result.current.send()
    })
    await waitFor(() => expect(result.current.available).toBe(false))

    state.now += 10_500

    await waitFor(
      () => expect(result.current.available).toBe(true),
      { timeout: 2000 }
    )
  })

  it("reste indisponible sans adversaire nommé", () => {
    const shared = { ...nominalWaitingRoom(), opponentId: null }
    const { result } = renderHook(() => useRoomWizz(shared, "room-1"), {
      wrapper,
    })

    expect(result.current.available).toBe(false)
  })
})
