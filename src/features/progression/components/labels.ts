import type { TranslationKey } from "@/lib/i18n/types"
import type {
  BadgeFamily,
  BadgeMetric,
  BadgeTier,
  MasteryTier,
} from "../domain/progression"

/**
 * Clés i18n typées des énumérations de progression : le backend n'expose que les **noms**
 * (`OR`, `BRONZE`…), la traduction vit ici.
 */
export const TIER_KEYS: Record<MasteryTier, TranslationKey> = {
  FER: "progression.tier.FER",
  BRONZE: "progression.tier.BRONZE",
  ARGENT: "progression.tier.ARGENT",
  OR: "progression.tier.OR",
  PLATINE: "progression.tier.PLATINE",
  EMERAUDE: "progression.tier.EMERAUDE",
  DIAMANT: "progression.tier.DIAMANT",
}

/** Clé de traduction d'un palier, avec repli bronze pour un palier inconnu des badges. */
export function tierKeyOf(tier: string): TranslationKey {
  return TIER_KEYS[tier as BadgeTier] ?? TIER_KEYS.BRONZE
}

/** Clé de traduction d'un palier de **maîtrise** : repli Fer pour un palier inconnu. */
export function masteryTierKeyOf(tier: string): TranslationKey {
  return TIER_KEYS[tier as MasteryTier] ?? TIER_KEYS.FER
}

export const FAMILY_KEYS: Record<BadgeFamily, TranslationKey> = {
  VOLUME: "progression.family.VOLUME",
  VICTORY: "progression.family.VICTORY",
  MASTERY: "progression.family.MASTERY",
  EXPLOIT: "progression.family.EXPLOIT",
  SERIES: "progression.family.SERIES",
  ASSIDUITY: "progression.family.ASSIDUITY",
  SOCIAL: "progression.family.SOCIAL",
  CHALLENGES: "progression.family.CHALLENGES",
  VISION: "progression.family.VISION",
  PRECISION: "progression.family.PRECISION",
  SPEED: "progression.family.SPEED",
  EXPLORATION: "progression.family.EXPLORATION",
  COLLECTION: "progression.family.COLLECTION",
}

export const METRIC_KEYS: Record<BadgeMetric, TranslationKey> = {
  HUMAN_DUELS: "progression.metric.HUMAN_DUELS",
  HUMAN_WINS: "progression.metric.HUMAN_WINS",
  TOPIC_MASTERY: "progression.metric.TOPIC_MASTERY",
  WIN_STREAK: "progression.metric.WIN_STREAK",
  PERFECT_DUELS: "progression.metric.PERFECT_DUELS",
  FAST_ANSWERS: "progression.metric.FAST_ANSWERS",
  DAILY_STREAK: "progression.metric.DAILY_STREAK",
  FOLLOWERS_GAINED: "progression.metric.FOLLOWERS_GAINED",
  CHALLENGES_SENT: "progression.metric.CHALLENGES_SENT",
  IMAGE_CORRECT: "progression.metric.IMAGE_CORRECT",
  DISTINCT_TOPICS: "progression.metric.DISTINCT_TOPICS",
  EARNED_BADGES: "progression.metric.EARNED_BADGES",
  ONE_SHOT: "progression.metric.ONE_SHOT",
}

/** Traductions des codes de badge connus du web. */
const BADGE_KEYS: Record<string, TranslationKey> = {
  FIRST_WIN: "progression.badge.FIRST_WIN",
  LIGHTNING: "progression.badge.LIGHTNING",
  PERFECT: "progression.badge.PERFECT",
  STREAK_MASTER: "progression.badge.STREAK_MASTER",
  DUELIST_FER: "progression.badge.DUELIST_FER",
  DUELIST_BRONZE: "progression.badge.DUELIST_BRONZE",
  DUELIST_ARGENT: "progression.badge.DUELIST_ARGENT",
  DUELIST_OR: "progression.badge.DUELIST_OR",
  DUELIST_PLATINE: "progression.badge.DUELIST_PLATINE",
  DUELIST_EMERAUDE: "progression.badge.DUELIST_EMERAUDE",
  DUELIST_DIAMANT: "progression.badge.DUELIST_DIAMANT",
  WINNER_FER: "progression.badge.WINNER_FER",
  WINNER_BRONZE: "progression.badge.WINNER_BRONZE",
  WINNER_ARGENT: "progression.badge.WINNER_ARGENT",
  WINNER_OR: "progression.badge.WINNER_OR",
  WINNER_PLATINE: "progression.badge.WINNER_PLATINE",
  WINNER_EMERAUDE: "progression.badge.WINNER_EMERAUDE",
  WINNER_DIAMANT: "progression.badge.WINNER_DIAMANT",
  MASTER_FER: "progression.badge.MASTER_FER",
  MASTER_BRONZE: "progression.badge.MASTER_BRONZE",
  MASTER_ARGENT: "progression.badge.MASTER_ARGENT",
  MASTER_OR: "progression.badge.MASTER_OR",
  MASTER_PLATINE: "progression.badge.MASTER_PLATINE",
  MASTER_EMERAUDE: "progression.badge.MASTER_EMERAUDE",
  MASTER_DIAMANT: "progression.badge.MASTER_DIAMANT",
  SERIES_FER: "progression.badge.SERIES_FER",
  SERIES_BRONZE: "progression.badge.SERIES_BRONZE",
  SERIES_ARGENT: "progression.badge.SERIES_ARGENT",
  SERIES_OR: "progression.badge.SERIES_OR",
  SERIES_PLATINE: "progression.badge.SERIES_PLATINE",
  SERIES_EMERAUDE: "progression.badge.SERIES_EMERAUDE",
  SERIES_DIAMANT: "progression.badge.SERIES_DIAMANT",
  ASSIDUITY_FER: "progression.badge.ASSIDUITY_FER",
  ASSIDUITY_BRONZE: "progression.badge.ASSIDUITY_BRONZE",
  ASSIDUITY_ARGENT: "progression.badge.ASSIDUITY_ARGENT",
  ASSIDUITY_OR: "progression.badge.ASSIDUITY_OR",
  ASSIDUITY_PLATINE: "progression.badge.ASSIDUITY_PLATINE",
  ASSIDUITY_EMERAUDE: "progression.badge.ASSIDUITY_EMERAUDE",
  ASSIDUITY_DIAMANT: "progression.badge.ASSIDUITY_DIAMANT",
  PRECISION_FER: "progression.badge.PRECISION_FER",
  PRECISION_BRONZE: "progression.badge.PRECISION_BRONZE",
  PRECISION_ARGENT: "progression.badge.PRECISION_ARGENT",
  PRECISION_OR: "progression.badge.PRECISION_OR",
  PRECISION_PLATINE: "progression.badge.PRECISION_PLATINE",
  PRECISION_EMERAUDE: "progression.badge.PRECISION_EMERAUDE",
  PRECISION_DIAMANT: "progression.badge.PRECISION_DIAMANT",
  SPEED_FER: "progression.badge.SPEED_FER",
  SPEED_BRONZE: "progression.badge.SPEED_BRONZE",
  SPEED_ARGENT: "progression.badge.SPEED_ARGENT",
  SPEED_OR: "progression.badge.SPEED_OR",
  SPEED_PLATINE: "progression.badge.SPEED_PLATINE",
  SPEED_EMERAUDE: "progression.badge.SPEED_EMERAUDE",
  SPEED_DIAMANT: "progression.badge.SPEED_DIAMANT",
  VISION_FER: "progression.badge.VISION_FER",
  VISION_BRONZE: "progression.badge.VISION_BRONZE",
  VISION_ARGENT: "progression.badge.VISION_ARGENT",
  VISION_OR: "progression.badge.VISION_OR",
  VISION_PLATINE: "progression.badge.VISION_PLATINE",
  VISION_EMERAUDE: "progression.badge.VISION_EMERAUDE",
  VISION_DIAMANT: "progression.badge.VISION_DIAMANT",
  SOCIAL_FER: "progression.badge.SOCIAL_FER",
  SOCIAL_BRONZE: "progression.badge.SOCIAL_BRONZE",
  SOCIAL_ARGENT: "progression.badge.SOCIAL_ARGENT",
  SOCIAL_OR: "progression.badge.SOCIAL_OR",
  SOCIAL_PLATINE: "progression.badge.SOCIAL_PLATINE",
  SOCIAL_EMERAUDE: "progression.badge.SOCIAL_EMERAUDE",
  SOCIAL_DIAMANT: "progression.badge.SOCIAL_DIAMANT",
  CHALLENGES_FER: "progression.badge.CHALLENGES_FER",
  CHALLENGES_BRONZE: "progression.badge.CHALLENGES_BRONZE",
  CHALLENGES_ARGENT: "progression.badge.CHALLENGES_ARGENT",
  CHALLENGES_OR: "progression.badge.CHALLENGES_OR",
  CHALLENGES_PLATINE: "progression.badge.CHALLENGES_PLATINE",
  CHALLENGES_EMERAUDE: "progression.badge.CHALLENGES_EMERAUDE",
  CHALLENGES_DIAMANT: "progression.badge.CHALLENGES_DIAMANT",
  EXPLORER_FER: "progression.badge.EXPLORER_FER",
  EXPLORER_BRONZE: "progression.badge.EXPLORER_BRONZE",
  EXPLORER_ARGENT: "progression.badge.EXPLORER_ARGENT",
  EXPLORER_OR: "progression.badge.EXPLORER_OR",
  EXPLORER_PLATINE: "progression.badge.EXPLORER_PLATINE",
  EXPLORER_EMERAUDE: "progression.badge.EXPLORER_EMERAUDE",
  EXPLORER_DIAMANT: "progression.badge.EXPLORER_DIAMANT",
  COLLECTOR_FER: "progression.badge.COLLECTOR_FER",
  COLLECTOR_BRONZE: "progression.badge.COLLECTOR_BRONZE",
  COLLECTOR_ARGENT: "progression.badge.COLLECTOR_ARGENT",
  COLLECTOR_OR: "progression.badge.COLLECTOR_OR",
  COLLECTOR_PLATINE: "progression.badge.COLLECTOR_PLATINE",
  COLLECTOR_EMERAUDE: "progression.badge.COLLECTOR_EMERAUDE",
  COLLECTOR_DIAMANT: "progression.badge.COLLECTOR_DIAMANT",
}

/**
 * Clé de traduction d'un badge, ou `null` si le web ne connaît pas encore le code : l'appelant
 * retombe alors sur le libellé **source** renvoyé par le serveur — un badge ajouté côté backend
 * s'affiche donc sans release du web.
 */
export function badgeLabelKey(code: string): TranslationKey | null {
  return BADGE_KEYS[code] ?? null
}

/** Phrase d'action d'une métrique (« Joue 3 duels contre des joueurs »). */
export const METRIC_ACTION_KEYS: Record<BadgeMetric, TranslationKey> = {
  HUMAN_DUELS: "progression.metricAction.HUMAN_DUELS",
  HUMAN_WINS: "progression.metricAction.HUMAN_WINS",
  TOPIC_MASTERY: "progression.metricAction.TOPIC_MASTERY",
  DISTINCT_TOPICS: "progression.metricAction.DISTINCT_TOPICS",
  WIN_STREAK: "progression.metricAction.WIN_STREAK",
  PERFECT_DUELS: "progression.metricAction.PERFECT_DUELS",
  FAST_ANSWERS: "progression.metricAction.FAST_ANSWERS",
  IMAGE_CORRECT: "progression.metricAction.IMAGE_CORRECT",
  FOLLOWERS_GAINED: "progression.metricAction.FOLLOWERS_GAINED",
  CHALLENGES_SENT: "progression.metricAction.CHALLENGES_SENT",
  DAILY_STREAK: "progression.metricAction.DAILY_STREAK",
  EARNED_BADGES: "progression.metricAction.EARNED_BADGES",
  ONE_SHOT: "progression.metricAction.ONE_SHOT",
}

/** Reste à faire d'une métrique (« Encore 1 victoire d'affilée »). */
export const METRIC_REMAINING_KEYS: Record<BadgeMetric, TranslationKey> = {
  HUMAN_DUELS: "progression.metricRemaining.HUMAN_DUELS",
  HUMAN_WINS: "progression.metricRemaining.HUMAN_WINS",
  TOPIC_MASTERY: "progression.metricRemaining.TOPIC_MASTERY",
  DISTINCT_TOPICS: "progression.metricRemaining.DISTINCT_TOPICS",
  WIN_STREAK: "progression.metricRemaining.WIN_STREAK",
  PERFECT_DUELS: "progression.metricRemaining.PERFECT_DUELS",
  FAST_ANSWERS: "progression.metricRemaining.FAST_ANSWERS",
  IMAGE_CORRECT: "progression.metricRemaining.IMAGE_CORRECT",
  FOLLOWERS_GAINED: "progression.metricRemaining.FOLLOWERS_GAINED",
  CHALLENGES_SENT: "progression.metricRemaining.CHALLENGES_SENT",
  DAILY_STREAK: "progression.metricRemaining.DAILY_STREAK",
  EARNED_BADGES: "progression.metricRemaining.EARNED_BADGES",
  ONE_SHOT: "progression.metricRemaining.ONE_SHOT",
}

/**
 * **Condition d'obtention** d'un exploit ponctuel (`metric: ONE_SHOT`), par code : la phrase de
 * métrique (« Réalise l'exploit ») ne dit rien au joueur. Un code inconnu du web retombe sur cette
 * phrase de métrique (aucune release nécessaire pour un nouvel exploit).
 */
export const ONE_SHOT_CONDITION_KEYS: Record<string, TranslationKey> = {
  FIRST_WIN: "progression.badgeCondition.FIRST_WIN",
  LIGHTNING: "progression.badgeCondition.LIGHTNING",
  PERFECT: "progression.badgeCondition.PERFECT",
  STREAK_MASTER: "progression.badgeCondition.STREAK_MASTER",
}
