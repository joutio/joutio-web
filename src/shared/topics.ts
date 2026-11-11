import type { TopicNames } from '@joutio/client-domain/api-types'
import { tokens, type CategoryCode } from '@/ui'

/** Code d'univers du BFF (`TopicCategory`) vers celui des jetons ; inconnu ou absent : `GENERAL`. */
export function toCategoryCode(value: string | null | undefined): CategoryCode {
  return value && value in tokens.category ? (value as CategoryCode) : 'GENERAL'
}

/** Nom d'un sujet dans la langue demandée, avec repli sur le français, l'anglais, puis le premier nom. */
export function topicName(names: TopicNames | null | undefined, language = 'fr'): string {
  if (!names) return ''
  return names[language] ?? names.fr ?? names.en ?? Object.values(names)[0] ?? ''
}
