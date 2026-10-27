/** Récompense du catalogue (`RewardsView.RewardView`). */
export interface Reward {
  code: string
  unlocked: boolean
  unlockedAt: string | null
  source: string | null
  condition: RewardCondition
}

export interface RewardCondition {
  badgeCode: string
  /** Libellé source du badge (repli si le web ne connaît pas le code). */
  badgeLabel: string
  target: number
}

/** Catalogue complet renvoyé par `GET /api/me/rewards`. */
export interface RewardsCatalog {
  rewards: Reward[]
}
