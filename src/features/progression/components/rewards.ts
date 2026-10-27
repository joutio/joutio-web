import type { TranslationKey } from "@/lib/i18n/types"

/** Métadonnées de présentation d'une récompense connue du web. */
export interface RewardMetadata {
  avatarStyle?: string
  labelKey: TranslationKey
  descriptionKey: TranslationKey
  conditionKey?: TranslationKey
}

const REWARDS: Record<string, RewardMetadata> = {
  MICAH_AVATAR: {
    avatarStyle: "micah",
    labelKey: "progression.rewards.MICAH_AVATAR.label",
    descriptionKey: "progression.rewards.MICAH_AVATAR.description",
    conditionKey: "progression.rewards.MICAH_AVATAR.condition",
  },
}

/** Métadonnées d'une récompense ; `undefined` pour un code ajouté après cette release web. */
export function rewardMetadata(code: string): RewardMetadata | undefined {
  return REWARDS[code]
}

/** Libellé traduit de la source d'une récompense, avec repli sur le code serveur. */
export const REWARD_SOURCE_KEYS: Record<string, TranslationKey> = {
  BADGE: "progression.rewards.sources.BADGE",
}

export function rewardSourceKey(source: string | null): TranslationKey | null {
  return source ? (REWARD_SOURCE_KEYS[source] ?? null) : null
}
