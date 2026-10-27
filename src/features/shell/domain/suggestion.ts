import type { TopicNames } from "@/features/topics/domain/topic"

/** Type de suggestion de la palette ⌘K (enum backend `SuggestionView.Type`). */
export type SuggestionType = "TOPIC" | "PLAYER"

/** Suggestion de la palette ⌘K (`SuggestionView`). */
export interface Suggestion {
  type: SuggestionType
  id: string
  label: string | null
  subtitle: string | null
  /** Catégorie du sujet (enum backend, `null` pour un joueur) : porte sa couleur éditoriale. */
  category: string | null
  emoji: string | null
  color: string | null
  imageUrl: string | null
  avatarOptions: string | null
  /** Noms localisés (sujets uniquement ; `null` pour un joueur). */
  names: TopicNames | null
  suspended?: boolean
}
