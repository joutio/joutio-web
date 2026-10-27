// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { CHALLENGE_ALREADY_PENDING } from "@/shared/utils/api-error-toast"
import type { ChallengeView } from "../domain/challenge"
import { challengesService } from "../lib/challenges"
import { useSentRematchStore } from "../stores/useSentRematchStore"
import { useRematchChallenge } from "./useRematchChallenge"

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock("@/features/shell", () => ({
  useImmersiveNavigate: () => mocks.navigate,
}))
vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({ serverNow: () => Date.now(), synced: true }),
}))
vi.mock("@/shared/utils/toast", () => ({ showToast: mocks.showToast }))
vi.mock("../lib/challenges", () => ({
  challengesService: { create: vi.fn(), get: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function challenge(overrides: Partial<ChallengeView> = {}): ChallengeView {
  return {
    challengeId: "c1",
    topic: {
      topicId: "t1",
      names: { fr: "Histoire" },
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
      titles: null,
    },
    challenger: null,
    opponent: null,
    status: "PENDING",
    roomId: null,
    gameId: "game-1",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10_000).toISOString(),
    ...overrides,
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  mocks.navigate.mockReset()
  mocks.showToast.mockReset()
  useSentRematchStore.setState({ challengeIds: [] })
  vi.mocked(challengesService.create).mockReset()
  vi.mocked(challengesService.get).mockReset()
})

describe("useRematchChallenge", () => {
  it("affiche un compte à rebours puis expire sans réponse", async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
      vi.mocked(challengesService.get).mockResolvedValue(challenge())

      const { result } = renderHook(() => useRematchChallenge(), { wrapper })

      act(() => {
        result.current.start({
          topicId: "t1",
          opponentId: "u2",
          gameId: "game-1",
        })
      })
      await act(async () => {
        for (let tick = 0; tick < 8; tick += 1) await Promise.resolve()
      })

      expect(result.current.pending).toBe(true)
      expect(result.current.remainingSeconds).toBe(10)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_100)
      })

      expect(result.current.pending).toBe(false)
      expect(result.current.refused).toBe(false)
      expect(mocks.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Revanche expirée" })
      )

      // Une expiration ne verrouille pas le bouton : une nouvelle demande est possible.
      act(() => {
        result.current.start({
          topicId: "t1",
          opponentId: "u2",
          gameId: "game-1",
        })
      })
      await act(async () => {
        for (let tick = 0; tick < 8; tick += 1) await Promise.resolve()
      })
      expect(challengesService.create).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it("verrouille le bouton après un refus explicite de l'adversaire", async () => {
    vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
    vi.mocked(challengesService.get).mockResolvedValue(
      challenge({ status: "DECLINED" })
    )

    const { result } = renderHook(() => useRematchChallenge(), { wrapper })

    act(() => {
      result.current.start({
        topicId: "t1",
        opponentId: "u2",
        gameId: "game-1",
      })
    })
    await act(async () => {
      for (let tick = 0; tick < 12; tick += 1) await Promise.resolve()
    })

    expect(result.current.pending).toBe(false)
    expect(result.current.refused).toBe(true)
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Revanche refusée" })
    )

    // Un refus explicite reste définitif : aucun nouvel envoi.
    act(() => {
      result.current.start({
        topicId: "t1",
        opponentId: "u2",
        gameId: "game-1",
      })
    })
    expect(challengesService.create).toHaveBeenCalledTimes(1)
  })

  it("ne coupe pas une attente dont l'échéance serveur est plus longue que le watchdog", async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
      vi.mocked(challengesService.get).mockResolvedValue(
        challenge({ expiresAt: new Date(Date.now() + 60_000).toISOString() })
      )

      const { result } = renderHook(() => useRematchChallenge(), { wrapper })

      act(() => {
        result.current.start({
          topicId: "t1",
          opponentId: "u2",
          gameId: "game-1",
        })
      })
      await act(async () => {
        for (let tick = 0; tick < 8; tick += 1) await Promise.resolve()
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000)
      })

      expect(result.current.pending).toBe(true)
      expect(result.current.refused).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("explique le refus quand la garde anti-spam bloque la revanche", async () => {
    vi.mocked(challengesService.create).mockRejectedValue({
      type: CHALLENGE_ALREADY_PENDING,
      message: "Challenge already pending",
    })

    const { result } = renderHook(() => useRematchChallenge(), { wrapper })

    act(() => {
      result.current.start({
        topicId: "t1",
        opponentId: "u2",
        gameId: "game-1",
      })
    })
    await act(async () => {
      for (let tick = 0; tick < 8; tick += 1) await Promise.resolve()
    })

    expect(result.current.pending).toBe(false)
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Défi déjà en attente" })
    )
  })

  it("navigue vers la salle quand l'adversaire accepte", async () => {
    vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
    vi.mocked(challengesService.get).mockResolvedValue(
      challenge({ status: "ACCEPTED", roomId: "room-1" })
    )

    const { result } = renderHook(() => useRematchChallenge(), { wrapper })

    act(() => {
      result.current.start({
        topicId: "t1",
        opponentId: "u2",
        gameId: "game-1",
      })
    })
    await act(async () => {
      for (let tick = 0; tick < 12; tick += 1) await Promise.resolve()
    })

    expect(mocks.navigate).toHaveBeenCalledWith("/rooms/room-1")
  })
})
