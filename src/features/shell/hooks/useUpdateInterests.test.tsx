// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { queryKeys } from "@/lib/query-keys"
import type { Me } from "../domain/me"
import { useUpdateInterests } from "./useUpdateInterests"

const mocks = vi.hoisted(() => ({
  updateInterests: vi.fn(),
  get: vi.fn(),
}))

vi.mock("../lib/me", () => ({
  meService: {
    updateInterests: mocks.updateInterests,
    get: mocks.get,
  },
}))

vi.mock("@/shared/utils/optimistic-reconcile", () => ({
  reconcileUntil: async ({
    read,
    onConverged,
  }: {
    read: () => Promise<Me>
    onConverged?: (me: Me) => void
  }) => {
    const me = await read()
    onConverged?.(me)
    return me
  },
}))

function meView(interests: string[] = []): Me {
  return {
    userId: "user-1",
    email: "ada@example.com",
    pseudonym: "Ada",
    bio: null,
    country: "FR",
    avatarOptions: null,
    bannerUrl: null,
    language: "fr",
    progression: {
      badges: [],
      rating: 1_200,
      peakRating: 1_200,
      ratedGames: 0,
      provisional: true,
    },
    stats: {
      played: 10,
      wins: 6,
      losses: 3,
      draws: 1,
      winPercent: 60,
      bestScore: 120,
      currentWinStreak: 2,
      bestWinStreak: 4,
    },
    followingCount: 3,
    followersCount: 4,
    interests,
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  mocks.updateInterests.mockReset()
  mocks.updateInterests.mockResolvedValue(undefined)
  mocks.get.mockReset()
  mocks.get.mockResolvedValue(meView(["HISTORY"]))
})

describe("useUpdateInterests", () => {
  it("enregistre les intérêts, patche me et invalide l'accueil", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(queryKeys.me(), meView())
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useUpdateInterests(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(["HISTORY"])
    })

    expect(mocks.updateInterests).toHaveBeenCalledWith(["HISTORY"])
    expect(queryClient.getQueryData<Me>(queryKeys.me())?.interests).toEqual([
      "HISTORY",
    ])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.home() })
  })

  it("restaure me si l'enregistrement échoue", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(queryKeys.me(), meView(["HISTORY"]))
    mocks.updateInterests.mockRejectedValueOnce(new Error("boom"))

    const { result } = renderHook(() => useUpdateInterests(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await expect(result.current.mutateAsync(["SCIENCE"])).rejects.toThrow(
        "boom"
      )
    })

    expect(queryClient.getQueryData<Me>(queryKeys.me())?.interests).toEqual([
      "HISTORY",
    ])
  })
})
