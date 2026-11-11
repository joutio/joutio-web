import type { CategoryCode, TierCode } from '../tokens.generated'

const slug = (code: string) => code.toLowerCase().replace(/_/g, '-')

export const categoryColor = (code: CategoryCode) => `var(--jo-category-${slug(code)})`

/** Couleur de catégorie assez contrastée pour du texte, en dark comme en light. */
export const categoryInk = (code: CategoryCode) =>
  `color-mix(in oklab, ${categoryColor(code)} 70%, var(--jo-text))`

export const tierColor = (code: TierCode) => `var(--jo-tier-${slug(code)})`

/** Couleur de rang assez contrastée pour du texte. */
export const tierInk = (code: TierCode) => `color-mix(in oklab, ${tierColor(code)} 60%, var(--jo-text))`

/** Teinte de fond légère dérivée d'une couleur de token. */
export const tint = (color: string) => `color-mix(in oklab, ${color} 16%, transparent)`
