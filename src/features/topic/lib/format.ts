import type { MasteryTier } from '@joutio/client/api-types'

/** Formats localisés partagés avec le mobile (`@joutio/client/i18n`). */
export { dayLabel, formatNumber } from '@joutio/client/i18n'

/** Seuils d'XP de maîtrise d'un sujet (`MasteryTier` de `joutio-profile-domain`) : conditions des titres verrouillés. */
export const MASTERY_XP: Record<MasteryTier, number> = {
  FER: 0,
  BRONZE: 500,
  ARGENT: 1_500,
  OR: 4_000,
  PLATINE: 9_000,
  EMERAUDE: 21_000,
  DIAMANT: 45_000,
}
export const MASTERY_TIERS = Object.keys(MASTERY_XP) as MasteryTier[]
