import { useTopicOverview } from '@/features/topic'
import { topicName } from '@/shared/topics'
import { tokens, type TierCode } from '@/ui'

/**
 * Nom du titre porté (`topicId:TIER`) : les vues ne portent que la clé, le nom vient des titres du sujet, avec le repli
 * « Palier · Sujet » (même règle que la fiche joueur).
 */
export function useEquippedTitle(key: string | null | undefined, language: string): string | undefined {
  const [topicId = '', tier] = (key ?? '').split(':') as [string?, TierCode?]
  const overview = useTopicOverview(topicId)
  if (!tier || !overview.data) return undefined
  return overview.data.titles?.[language]?.[tier] ?? overview.data.titles?.fr?.[tier] ?? `${tokens.tier[tier].label} · ${topicName(overview.data.topic.names, language)}`
}
