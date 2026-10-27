// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Me } from "@/features/shell/domain/me"
import { queryKeys } from "@/lib/query-keys"
import type { PlayerProfile } from "../domain/profile"

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  follow: vi.fn(),
  unfollow: vi.fn(),
  headToHead: vi.fn(),
}))

vi.mock("@/features/auth", () => ({
  getSessionUserId: () => "me-1",
}))

vi.mock("../lib/profiles", () => ({
  profilesService: {
    profile: mocks.profile,
    follow: mocks.follow,
    unfollow: mocks.unfollow,
    headToHead: mocks.headToHead,
    people: vi.fn(),
    games: vi.fn(),
  },
}))

import { useHeadToHead, useToggleUserFollow } from "./usePlayer"

const PROGRESSION = {
  badges: [],
  rating: 200,
  peakRating: 200,
  ratedGames: 0,
  provisional: true,
}

const STATS = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winPercent: 0,
  bestScore: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
}

function profileFixture(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    userId: "u2",
    pseudonym: "Bob",
    bio: null,
    country: null,
    avatarOptions: null,
    isMe: false,
    following: false,
    presence: null,
    progression: PROGRESSION,
    stats: STATS,
    followersCount: 10,
    equippedTitle: null,
    followingCount: 2,
    ...overrides,
    bannerUrl: overrides.bannerUrl ?? null,
  }
}

const ME_FIXTURE: Me = {
  userId: "me-1",
  email: null,
  pseudonym: "Me",
  bio: null,
  country: null,
  avatarOptions: null,
  bannerUrl: null,
  language: "fr",
  progression: PROGRESSION,
  stats: STATS,
  followingCount: 2,
  followersCount: 5,
}

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderFollow(client: QueryClient) {
  return renderHook(() => useToggleUserFollow("u2"), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

describe("useHeadToHead", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("lit le bilan du point de vue du viewer", async () => {
    const client = createClient()
    mocks.headToHead.mockResolvedValue({
      played: 3,
      wins: 2,
      losses: 1,
      draws: 0,
    })

    const { result } = renderHook(() => useHeadToHead("me-1", "u2"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mocks.headToHead).toHaveBeenCalledWith("me-1", "u2")
    expect(result.current.data).toEqual({
      played: 3,
      wins: 2,
      losses: 1,
      draws: 0,
    })
  })
})

describe("useToggleUserFollow", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("conserve le patch optimiste et converge, sans jamais appliquer la lecture périmée", async () => {
    const client = createClient()
    client.setQueryData(queryKeys.profiles.detail("u2"), profileFixture())
    client.setQueryData(queryKeys.me(), ME_FIXTURE)

    mocks.follow.mockResolvedValue(undefined)
    mocks.profile
      // 1re lecture de convergence : la projection est encore en retard.
      .mockResolvedValueOnce(
        profileFixture({ following: false, followersCount: 10 })
      )
      .mockResolvedValue(
        profileFixture({ following: true, followersCount: 11 })
      )

    const { result } = renderFollow(client)

    // `onMutate` est async (annulation des refetch en vol) : on laisse la microtâche se poser.
    await act(async () => {
      result.current.toggle()
    })

    // Patch optimiste immédiat (le clic ne doit jamais sembler perdu).
    expect(
      client.getQueryData<PlayerProfile>(queryKeys.profiles.detail("u2"))
        ?.followersCount
    ).toBe(11)
    expect(client.getQueryData<Me>(queryKeys.me())?.followingCount).toBe(3)

    // La lecture périmée n'a pas été écrite : on relit jusqu'à convergence (2 lectures),
    // et le cache porte toujours le patch optimiste confirmé (jamais la valeur périmée).
    await waitFor(() => expect(mocks.profile).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    })
    const view = client.getQueryData<PlayerProfile>(
      queryKeys.profiles.detail("u2")
    )
    expect(view?.following).toBe(true)
    expect(view?.followersCount).toBe(11)
  })

  it("restaure l'état optimiste quand la mutation échoue", async () => {
    const client = createClient()
    client.setQueryData(queryKeys.profiles.detail("u2"), profileFixture())
    client.setQueryData(queryKeys.me(), ME_FIXTURE)

    mocks.follow.mockRejectedValue(new Error("boom"))

    const { result } = renderFollow(client)

    await act(async () => {
      result.current.toggle()
    })

    await waitFor(() => {
      const view = client.getQueryData<PlayerProfile>(
        queryKeys.profiles.detail("u2")
      )
      expect(view?.following).toBe(false)
      expect(view?.followersCount).toBe(10)
    })
    expect(client.getQueryData<Me>(queryKeys.me())?.followingCount).toBe(2)
  })
})
