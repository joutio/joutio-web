/** Paliers Elo partagés (avatars, profil, badges de rang). */
export type EloTier =
  | "FER" | "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "EMERAUDE" | "DIAMANT"

export const ELO_TIERS: readonly { rank: EloTier; min: number }[] = [
  { rank: "FER", min: 0 },
  { rank: "BRONZE", min: 400 },
  { rank: "ARGENT", min: 600 },
  { rank: "OR", min: 800 },
  { rank: "PLATINE", min: 1000 },
  { rank: "EMERAUDE", min: 1200 },
  { rank: "DIAMANT", min: 1400 },
]

export const ELO_INITIAL = 200

export function eloTier(rating: number): EloTier {
  let tier: EloTier = "FER"
  for (const entry of ELO_TIERS) {
    if (rating >= entry.min) tier = entry.rank
  }
  return tier
}

export function nextEloTier(rating: number): { rank: EloTier; min: number } | null {
  return ELO_TIERS.find((entry) => entry.min > rating) ?? null
}

export function eloProgressPercent(rating: number): number {
  const current = eloTier(rating)
  const next = nextEloTier(rating)
  if (!next) return 100
  const currentMin = ELO_TIERS.find((entry) => entry.rank === current)?.min ?? 0
  const span = next.min - currentMin
  if (span <= 0) return 100
  return Math.max(0, Math.min(100, Math.round(((rating - currentMin) * 100) / span)))
}
