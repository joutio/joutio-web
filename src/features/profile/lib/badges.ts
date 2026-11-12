import type { BadgeCollectionView, BadgeFamily, BadgeItemView } from '@joutio/client-domain/api-types'
import {
  CalendarCheckIcon,
  CompassIcon,
  CrownIcon,
  EyeIcon,
  FireIcon,
  GaugeIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  SparkleIcon,
  StackIcon,
  SwordIcon,
  TargetIcon,
  UsersIcon,
  type Icon,
} from '@phosphor-icons/react'
import { formatNumber } from '@/features/topic'
import type { MessageKey } from '@/lib/i18n'
import { tokens, type LadderRung, type TierCode } from '@/ui'

type T = (key: MessageKey, values?: Record<string, string | number>) => string

const TIERS = Object.keys(tokens.tier) as TierCode[]

/** Emblème de chaque famille ; nom et définition dans les textes (`badges.family.*`). */
const ICONS: Record<BadgeFamily, Icon> = {
  VOLUME: SwordIcon,
  VICTORY: CrownIcon,
  MASTERY: GraduationCapIcon,
  EXPLOIT: SparkleIcon,
  SERIES: FireIcon,
  ASSIDUITY: CalendarCheckIcon,
  SOCIAL: UsersIcon,
  CHALLENGES: MegaphoneIcon,
  VISION: EyeIcon,
  PRECISION: TargetIcon,
  SPEED: GaugeIcon,
  EXPLORATION: CompassIcon,
  COLLECTION: StackIcon,
}

/** Unité d'un compteur (`badges.unit.*`), par métrique du BFF. */
const UNITS = new Set([
  'HUMAN_DUELS',
  'HUMAN_WINS',
  'WIN_STREAK',
  'PERFECT_DUELS',
  'FAST_ANSWERS',
  'DAILY_STREAK',
  'FOLLOWERS_GAINED',
  'CHALLENGES_SENT',
  'IMAGE_CORRECT',
  'TOPIC_MASTERY',
  'DISTINCT_TOPICS',
  'EARNED_BADGES',
  'ONE_SHOT',
])

export type BadgeFamilySummary = {
  family: BadgeFamily
  name: string
  icon: Icon
  description: string
  /** Paliers acquis, de 0 à 7. */
  earned: number
  /** Avancement vers le palier suivant, en %. */
  progress: number
  /** `Or · 30 / 100`, `Diamant · complet`. */
  meta: string
  rungs: LadderRung[]
}

/** Une famille de la collection, mise en forme pour `BadgeFamilyRow` et `RankLadder` (comme le mobile). */
function summarize(family: BadgeFamily, badges: readonly BadgeItemView[], t: T, language: string): BadgeFamilySummary {
  const known = family in ICONS
  const sorted = [...badges].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier))
  const earned = sorted.filter((badge) => badge.earned).length
  const current = sorted.find((badge) => !badge.earned)
  const lastEarned = [...sorted].reverse().find((badge) => badge.earned)
  const progress = current ? Math.round((Math.min(current.progress, current.target) / Math.max(1, current.target)) * 100) : 100
  const reached = lastEarned ? tokens.tier[lastEarned.tier].label : undefined
  const count = (value: number) => formatNumber(value, language)
  const meta = current
    ? [reached, `${count(current.progress)} / ${count(current.target)}`].filter(Boolean).join(' · ')
    : t('badges.complete', { tier: reached ?? '' })
  const unit = (badge: BadgeItemView) => (UNITS.has(badge.metric) ? t(`badges.unit.${badge.metric}` as MessageKey) : '')
  const rungs = sorted.map<LadderRung>((badge) => ({
    tier: badge.tier,
    rule: `${count(badge.target)} ${unit(badge)}`.trim(),
    status: badge.earned ? t('badges.earned') : badge === current ? `${count(badge.progress)} / ${count(badge.target)}` : '—',
    earned: badge.earned,
  }))
  return {
    family,
    name: known ? t(`badges.family.${family}` as MessageKey) : family,
    icon: ICONS[family] ?? SparkleIcon,
    description: known ? t(`badges.family.${family}.text` as MessageKey) : '',
    earned,
    progress,
    meta,
    rungs,
  }
}

/** Familles à échelle, dans l'ordre du serveur. */
export function familiesOf(collection: BadgeCollectionView, t: T, language: string): BadgeFamilySummary[] {
  return collection.families.filter((group) => group.badges.length > 0).map((group) => summarize(group.family, group.badges, t, language))
}

export const badgesSummary = (collection: BadgeCollectionView, t: T) =>
  t('badges.summary', { earned: collection.earnedCount, total: collection.totalCount, families: collection.families.length })
