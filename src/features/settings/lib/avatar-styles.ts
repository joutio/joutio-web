import type { BadgeCollectionView, MeView, RewardsView } from '@joutio/client-domain/api-types'
import type { RewardState } from '@/ui'

export type EditorStyleId = 'base' | 'micah' | 'lorelei' | 'notionists'

/** Styles d'avatar, dans l'ordre du lab (`REWARD_STYLES`). */
export const EDITOR_STYLES: readonly { id: EditorStyleId; title: string }[] = [
  { id: 'base', title: 'Avatar de base' },
  { id: 'micah', title: 'Micah' },
  { id: 'lorelei', title: 'Lorelei' },
  { id: 'notionists', title: 'Notionists' },
]

export const MICAH_REWARD = 'MICAH_AVATAR'

export type StyleEntry = {
  id: EditorStyleId
  title: string
  state: RewardState
  /** Droit d'utilisation : débloqué ou Premium. */
  usable: boolean
  kind: 'free' | 'premium' | 'micah'
  /** Micah : badge à obtenir, avancement et date de déblocage. */
  badgeLabel?: string
  target?: number
  done?: number
  unlockedAt?: string | null
}

/**
 * État de chaque style pour le joueur, comme `AvatarEntitlementPolicy` du BFF (et le mobile) : base gratuite, Micah par
 * récompense ou Premium, Lorelei et Notionists Premium. `current` : style choisi dans l'éditeur.
 */
export function styleEntries(me: MeView | undefined, rewards: RewardsView | undefined, badges: BadgeCollectionView | undefined, current: string): StyleEntry[] {
  const premium = me?.premium ?? false
  const micah = rewards?.rewards.find((reward) => reward.code === MICAH_REWARD)
  const micahUnlocked = premium || micah?.unlocked === true || (me?.rewards ?? []).includes(MICAH_REWARD)
  const condition = micah?.condition
  const badge = condition ? badges?.families.flatMap((family) => family.badges).find((item) => item.code === condition.badgeCode) : undefined
  return EDITOR_STYLES.map(({ id, title }) => {
    const usable = id === 'base' || (id === 'micah' ? micahUnlocked : premium)
    const state: RewardState = id === current && usable ? 'active' : usable ? 'unlocked' : id === 'micah' ? 'locked' : 'premium'
    if (id === 'base') return { id, title, state, usable, kind: 'free' }
    if (id !== 'micah') return { id, title, state, usable, kind: 'premium' }
    const target = badge?.target ?? condition?.target ?? 7
    return { id, title, state, usable, kind: 'micah', badgeLabel: condition?.badgeLabel, target, done: Math.min(badge?.progress ?? 0, target), unlockedAt: micah?.unlockedAt }
  })
}
