import { tokens, type TierCode } from '@/ui'

/** Palier d'un Elo : le plus haut dont le seuil `minElo` est atteint (tokens `tier`). Affichage seulement. */
export function tierOf(rating: number): TierCode {
  const tiers = Object.entries(tokens.tier) as [TierCode, { minElo: number }][]
  return tiers.reduce<TierCode>((best, [code, tier]) => (rating >= tier.minElo && tier.minElo >= tokens.tier[best].minElo ? code : best), 'FER')
}
