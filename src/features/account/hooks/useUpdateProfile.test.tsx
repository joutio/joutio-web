// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { profilesService } from "@/features/player"
import type {
  Language,
  PlayerProfile,
  Progression,
} from "@/features/player/domain/profile"
import { queryKeys } from "@/lib/query-keys"
import { meService, type Me } from "@/features/shell"
import { useUpdateProfile } from "./useUpdateProfile"

vi.mock("@/features/shell", () => ({
  useMe: () => ({ userId: "user-1", data: undefined }),
  meService: { get: vi.fn() },
}))
vi.mock("@/features/player", () => ({
  profilesService: {
    profile: vi.fn(() => Promise.resolve(playerProfile())),
    updatePseudonym: vi.fn(),
    updateBio: vi.fn(),
    updateCountry: vi.fn(),
    updateAvatarOptions: vi.fn(),
    updateLanguage: vi.fn(),
  },
}))

const progression: Progression = {
  badges: [],
  rating: 1_200,
  peakRating: 1_200,
  ratedGames: 0,
  provisional: true,
}

function meView(language: Language = "fr"): Me {
  return {
    userId: "user-1",
    email: "ada@example.com",
    pseudonym: "Ada",
    bio: null,
    country: "FR",
    avatarOptions: null,
    bannerUrl: null,
    language,
    progression,
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
    equippedTitle: null,
    followingCount: 3,
    followersCount: 4,
  }
}

function playerProfile(): PlayerProfile {
  return {
    userId: "user-1",
    pseudonym: "Ada",
    bio: null,
    country: "FR",
    avatarOptions: null,
    bannerUrl: null,
    isMe: true,
    following: false,
    presence: null,
    progression,
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
    followersCount: 4,
    followingCount: 3,
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe("useUpdateProfile", () => {
  it("patche me + la fiche joueur immédiatement, avant la réponse serveur", async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(queryKeys.me(), meView())
    queryClient.setQueryData(
      queryKeys.profiles.detail("user-1"),
      playerProfile()
    )

    let respond: (() => void) | undefined
    vi.mocked(profilesService.updatePseudonym).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          respond = resolve
        })
    )
    // La relecture de convergence voit le patch appliqué (projection immédiate).
    vi.mocked(profilesService.profile).mockResolvedValue({
      ...playerProfile(),
      pseudonym: "Nouvelle",
    })

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    })

    let pending: Promise<void>
    act(() => {
      pending = result.current.mutateAsync({ pseudonym: "Nouvelle" })
    })

    // Optimiste : les deux vues observables reflètent la saisie sans attendre le serveur
    // (`onMutate` attend l'annulation des refetch en vol avant de patcher).
    await waitFor(() => {
      expect(queryClient.getQueryData<Me>(queryKeys.me())?.pseudonym).toBe(
        "Nouvelle"
      )
    })
    expect(
      queryClient.getQueryData<PlayerProfile>(
        queryKeys.profiles.detail("user-1")
      )?.pseudonym
    ).toBe("Nouvelle")

    await act(async () => {
      respond?.()
      await pending
    })
  })

  it("restaure les caches si la commande échoue", async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(queryKeys.me(), meView())
    queryClient.setQueryData(
      queryKeys.profiles.detail("user-1"),
      playerProfile()
    )
    vi.mocked(profilesService.updatePseudonym).mockRejectedValue(
      new Error("boom")
    )

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ pseudonym: "Nouvelle" })
      ).rejects.toThrow("boom")
    })

    expect(queryClient.getQueryData<Me>(queryKeys.me())?.pseudonym).toBe("Ada")
    expect(
      queryClient.getQueryData<PlayerProfile>(
        queryKeys.profiles.detail("user-1")
      )?.pseudonym
    ).toBe("Ada")
  })

  it("langue : relit jusqu'à convergence et n'écrit jamais une valeur périmée", async () => {
    vi.useFakeTimers()
    try {
      const queryClient = createQueryClient()
      queryClient.setQueryData(queryKeys.me(), meView("fr"))
      queryClient.setQueryData(
        queryKeys.profiles.detail("user-1"),
        playerProfile()
      )
      vi.mocked(profilesService.updateLanguage).mockResolvedValue(undefined)
      // Première lecture encore en retard (projection), seconde convergée.
      vi.mocked(meService.get)
        .mockResolvedValueOnce(meView("fr"))
        .mockResolvedValueOnce(meView("en"))
      const invalidate = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(queryClient),
      })

      act(() => {
        result.current.mutate({ language: "en" })
      })

      // Convergence immédiate (plus de fenêtre de projection) : 1ʳᵉ lecture périmée, puis
      // intervalle de 700 ms avant la lecture convergée.
      await act(async () => {
        for (let tick = 0; tick < 12; tick += 1) await Promise.resolve()
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700)
      })

      expect(queryClient.getQueryData<Me>(queryKeys.me())?.language).toBe("en")
      expect(meService.get).toHaveBeenCalledTimes(2)
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: queryKeys.profiles.detail("user-1"),
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
