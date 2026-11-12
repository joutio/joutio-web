import type { TitleView } from '@joutio/client-domain/api-types'
import { formatNumber } from '@/features/topic'
import type { MessageKey } from '@/lib/i18n'
import { topicName } from '@/shared/topics'
import { tokens, type TierCode } from '@/ui'

type T = (key: MessageKey, values?: Record<string, string | number>) => string

export const RANKS = Object.keys(tokens.tier) as TierCode[]

/** Condition d'un rang : « Moins de 400 Elo », « Dès 600 Elo ». */
export function rankRule(tier: TierCode, t: T, language: string) {
  const index = RANKS.indexOf(tier)
  const next = RANKS[index + 1]
  if (index === 0 && next) return t('ranks.below', { elo: formatNumber(tokens.tier[next].minElo, language) })
  return t('ranks.from', { elo: formatNumber(tokens.tier[tier].minElo, language) })
}

/** Avancement dans le rang courant : « Or · 856 », 28 %, « 144 Elo avant Platine ». */
export function rankProgress(tier: TierCode, rating: number, t: T, language: string) {
  const next = RANKS[RANKS.indexOf(tier) + 1]
  const label = `${tokens.tier[tier].label} · ${formatNumber(rating, language)}`
  if (!next) return { label, progress: 100, next: t('ranks.top') }
  const from = tokens.tier[tier].minElo
  const to = tokens.tier[next].minElo
  return {
    label,
    progress: Math.round(((rating - from) / Math.max(1, to - from)) * 100),
    next: t('ranks.before', { elo: formatNumber(Math.max(0, to - rating), language), tier: tokens.tier[next].label }),
  }
}

/** Libellé d'un titre : nom thématique du sujet s'il existe, sinon « palier · sujet » (composé côté client). */
export const titleLabel = (title: TitleView, language: string) =>
  title.topic.titles?.[language]?.[title.tier] ?? title.topic.titles?.fr?.[title.tier] ?? `${tokens.tier[title.tier].label} · ${topicName(title.topic.names, language)}`
