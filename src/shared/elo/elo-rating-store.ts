import { useEffect } from "react"
import { create } from "zustand"
import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"

export interface PlayerRating {
  userId: string
  rating: number
  provisional: boolean
}

interface EloRatingState {
  ratings: Record<string, PlayerRating>
  pending: string[]
  requested: Record<string, true>
  request: (userId: string) => void
  merge: (ratings: PlayerRating[]) => void
  fail: (ids: string[]) => void
  clear: () => void
}

const MAX_BATCH = 100

/**
 * Cache partagé des Elo publics : les avatars demandent leur rating, un seul appel batch est
 * émis par la coquille (`useEloRatingSync`) pour éviter le fan-out N+1.
 */
export const useEloRatingStore = create<EloRatingState>((set, get) => ({
  ratings: {},
  pending: [],
  requested: {},
  request: (userId) => {
    const state = get()
    if (!userId || state.ratings[userId] || state.requested[userId]) return
    if (state.pending.includes(userId)) return
    set({ pending: [...state.pending, userId] })
  },
  merge: (ratings) => {
    const state = get()
    const next = { ...state.ratings }
    for (const rating of ratings) next[rating.userId] = rating
    const done = new Set(ratings.map((rating) => rating.userId))
    set({
      ratings: next,
      pending: state.pending.filter((id) => !done.has(id)),
      requested: {
        ...state.requested,
        ...Object.fromEntries(ratings.map((rating) => [rating.userId, true as const])),
      },
    })
  },
  fail: (ids) => {
    const state = get()
    const failed = new Set(ids)
    const requested = { ...state.requested }
    for (const id of ids) delete requested[id]
    set({
      pending: state.pending.filter((id) => !failed.has(id)),
      requested,
    })
  },
  clear: () => set({ ratings: {}, pending: [], requested: {} }),
}))

/** Rating d'un joueur (et demande de chargement si absent). */
export function useEloRating(userId?: string): PlayerRating | undefined {
  const rating = useEloRatingStore((state) =>
    userId ? state.ratings[userId] : undefined
  )
  const request = useEloRatingStore((state) => state.request)
  useEffect(() => {
    if (userId && !rating) request(userId)
  }, [userId, rating, request])
  return rating
}

/** Flusher unique monté dans `AppShell`. */
export function useEloRatingSync(): void {
  const pending = useEloRatingStore((state) => state.pending)
  const merge = useEloRatingStore((state) => state.merge)
  const fail = useEloRatingStore((state) => state.fail)

  useEffect(() => {
    if (pending.length === 0) return
    const ids = pending.slice(0, MAX_BATCH)
    const timer = window.setTimeout(() => {
      void api
        .get<PlayerRating[]>(ENDPOINTS.profiles.ratings, {
          params: { ids: ids.join(",") },
        })
        .then(merge)
        .catch(() => fail(ids))
    }, 50)
    return () => window.clearTimeout(timer)
  }, [pending, merge, fail])
}
