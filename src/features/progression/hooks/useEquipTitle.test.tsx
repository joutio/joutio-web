// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { queryKeys } from "@/lib/query-keys"
import type { Me } from "@/features/shell/domain/me"
import type { PlayerTitles, UnlockedTitle } from "../domain/progression"
import { progressionService } from "../lib/progression"
import { useEquipTitle } from "./useEquipTitle"

vi.mock("../lib/progression", () => ({
  progressionService: {
    equipTitle: vi.fn(),
    titles: vi.fn(),
  },
}))

const ME: Me = {
  userId: "u1",
  email: null,
  pseudonym: "Ada",
  bio: null,
  country: null,
  avatarOptions: null,
  bannerUrl: null,
  language: "fr",
  equippedTitle: null,
  progression: {
    badges: [],
    rating: 200,
    peakRating: 200,
    ratedGames: 0,
    provisional: true,
  },
  stats: {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winPercent: 0,
    bestScore: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
  },
  followingCount: 0,
  followersCount: 0,
}

const TITLE: UnlockedTitle = {
  key: "t1:FER",
  topicId: "t1",
  tier: "FER",
  tierProgressPercent: 0,
  tierRemainingXp: 300,
  nextTier: "BRONZE",
  topic: {
    topicId: "t1",
    names: { fr: "Harry Potter", en: "Harry Potter" },
    category: "LITERATURE",
    emoji: "⚡",
    color: "#7c3aed",
    imageUrl: null,
    titles: { fr: { FER: "Moldu perdu" }, en: { FER: "Lost Muggle" } },
  },
}

const TITLES: PlayerTitles = { equippedKey: null, titles: [TITLE] }

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useEquipTitle", () => {
  it("patche me.equippedTitle et profiles.titles avant la réponse serveur", async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(queryKeys.me(), ME)
    queryClient.setQueryData(queryKeys.profiles.titles("u1"), TITLES)

    let resolveEquip!: () => void
    vi.mocked(progressionService.equipTitle).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveEquip = resolve
      })
    )
    vi.mocked(progressionService.titles).mockResolvedValue({
      ...TITLES,
      equippedKey: "t1:FER",
    })

    const { result } = renderHook(() => useEquipTitle("u1"), {
      wrapper: createWrapper(queryClient),
    })

    let pending: Promise<void>
    act(() => {
      pending = result.current.mutateAsync("t1:FER")
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<Me>(queryKeys.me())?.equippedTitle).toBe(
        "t1:FER"
      )
      expect(
        queryClient.getQueryData<PlayerTitles>(queryKeys.profiles.titles("u1"))
          ?.equippedKey
      ).toBe("t1:FER")
    })

    await act(async () => {
      resolveEquip()
      await pending
    })

    await waitFor(() =>
      expect(progressionService.titles).toHaveBeenCalledWith("u1")
    )
  })

  it("n'affiche pas une clé orpheline tant que le titre n'est pas dans la vue", async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(queryKeys.me(), ME)
    queryClient.setQueryData(queryKeys.profiles.titles("u1"), {
      equippedKey: null,
      titles: [],
    })

    let resolveEquip!: () => void
    vi.mocked(progressionService.equipTitle).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveEquip = resolve
      })
    )
    vi.mocked(progressionService.titles).mockResolvedValue({
      ...TITLES,
      equippedKey: "t1:FER",
    })

    const { result } = renderHook(() => useEquipTitle("u1"), {
      wrapper: createWrapper(queryClient),
    })

    let pending: Promise<void>
    act(() => {
      pending = result.current.mutateAsync("t1:FER")
    })

    await waitFor(() =>
      expect(queryClient.getQueryData<Me>(queryKeys.me())?.equippedTitle).toBe(
        "t1:FER"
      )
    )
    // La vue des titres ne connaît pas encore ce titre : on ne pose pas la clé (ruban vide).
    expect(
      queryClient.getQueryData<PlayerTitles>(queryKeys.profiles.titles("u1"))
        ?.equippedKey
    ).toBeNull()

    await act(async () => {
      resolveEquip()
      await pending
    })
    await waitFor(() =>
      expect(
        queryClient.getQueryData<PlayerTitles>(queryKeys.profiles.titles("u1"))
          ?.equippedKey
      ).toBe("t1:FER")
    )
  })

  it("restaure les deux caches si le serveur refuse", async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(queryKeys.me(), ME)
    queryClient.setQueryData(queryKeys.profiles.titles("u1"), TITLES)
    vi.mocked(progressionService.equipTitle).mockRejectedValue(
      new Error("refus")
    )

    const { result } = renderHook(() => useEquipTitle("u1"), {
      wrapper: createWrapper(queryClient),
    })

    await expect(result.current.mutateAsync("t1:FER")).rejects.toThrow(
      "refus"
    )

    expect(
      queryClient.getQueryData<Me>(queryKeys.me())?.equippedTitle
    ).toBeNull()
    expect(
      queryClient.getQueryData<PlayerTitles>(queryKeys.profiles.titles("u1"))
        ?.equippedKey
    ).toBeNull()
  })
})
