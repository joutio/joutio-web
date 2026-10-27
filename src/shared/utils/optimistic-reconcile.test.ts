import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  PROJECTION_RECONCILE_DELAY_MS,
  reconcileUntil,
  removeMatchingFromList,
  scheduleInvalidate,
} from "./optimistic-reconcile"

interface FollowView {
  following: boolean
  followersCount: number
}

describe("reconcileUntil", () => {
  it("converge sur la réponse confirmée sans jamais appliquer de valeur périmée", async () => {
    const stale: FollowView = { following: false, followersCount: 10 }
    const fresh: FollowView = { following: true, followersCount: 11 }
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(fresh)
    const onConverged = vi.fn()
    const onTimeout = vi.fn()

    const result = await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout,
      sleep: () => Promise.resolve(),
    })

    expect(read).toHaveBeenCalledTimes(3)
    expect(onConverged).toHaveBeenCalledTimes(1)
    expect(onConverged).toHaveBeenCalledWith(fresh)
    expect(onTimeout).not.toHaveBeenCalled()
    expect(result).toEqual(fresh)
  })

  it("invalide en secours au timeout quand la convergence n'est jamais observée", async () => {
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockResolvedValue({ following: false, followersCount: 10 })
    const onConverged = vi.fn()
    const onTimeout = vi.fn()

    const result = await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout,
      attempts: 3,
      sleep: () => Promise.resolve(),
    })

    expect(read).toHaveBeenCalledTimes(3)
    expect(onConverged).not.toHaveBeenCalled()
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
  })

  it("traite une erreur de lecture comme une tentative non convergée", async () => {
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockRejectedValueOnce(new Error("bus down"))
      .mockResolvedValueOnce({ following: true, followersCount: 11 })
    const onConverged = vi.fn()

    await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout: vi.fn(),
      sleep: () => Promise.resolve(),
    })

    expect(read).toHaveBeenCalledTimes(2)
    expect(onConverged).toHaveBeenCalledWith({
      following: true,
      followersCount: 11,
    })
  })

  it("abandonne sans attendre sur état terminal (abort), sans onTimeout", async () => {
    interface ChallengeView {
      state: "pending" | "ready" | "gone"
    }
    const onTimeout = vi.fn()
    let reads = 0

    const result = await reconcileUntil<ChallengeView>({
      read: async () => {
        reads += 1
        return { state: "gone" as const }
      },
      matches: (view) => view.state === "ready",
      abort: (view) => view.state === "gone",
      onTimeout,
      sleep: () => Promise.resolve(),
    })

    expect(result).toBeNull()
    expect(reads).toBe(1)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})

describe("scheduleInvalidate", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  it("invalide toutes les clés après le délai (jamais immédiatement)", async () => {
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    scheduleInvalidate(queryClient, [["a"], ["b", "c"]], 0)
    expect(invalidate).not.toHaveBeenCalled()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["a"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["b", "c"] })
  })

  it("attend la fenêtre de projection Axon par défaut", () => {
    expect(PROJECTION_RECONCILE_DELAY_MS).toBeGreaterThanOrEqual(2_000)
  })
})

describe("removeMatchingFromList", () => {
  it("retire les éléments correspondants et laisse le reste intact", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      ["items"],
      [
        { id: "a", keep: true },
        { id: "b", keep: false },
      ]
    )

    removeMatchingFromList<{ id: string; keep: boolean }>(
      queryClient,
      ["items"],
      (item) => !item.keep
    )

    expect(queryClient.getQueryData(["items"])).toEqual([
      { id: "a", keep: true },
    ])
  })
})
