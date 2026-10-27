import {
  ELO_TIERS as SHARED_TIERS,
  eloProgressPercent as sharedProgress,
  eloTier as sharedTier,
  nextEloTier as sharedNext,
  type EloTier,
} from "@/shared/elo/elo"

export type Rank = EloTier

export const ELO_TIERS = SHARED_TIERS as readonly { rank: Rank; min: number }[]
export const ELO_INITIAL = 200
export const ELO_PROVISIONAL_GAMES = 10

export const eloTier = (rating: number): Rank => sharedTier(rating)
export const nextEloTier = (rating: number) => sharedNext(rating)
export const eloProgressPercent = (rating: number) => sharedProgress(rating)
