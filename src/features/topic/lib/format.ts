import type { MasteryTier } from '@joutio/client-domain/api-types'

/** `2 418` dans la langue de l'app. */
export const formatNumber = (value: number, language = 'fr') => new Intl.NumberFormat(language).format(value)

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

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/** Jour d'un groupe de parties : `today`, `yesterday`, le nom du jour dans la semaine, puis « Dimanche 25 oct. ». */
export function dayLabel(date: Date, language: string, labels: { today: string; yesterday: string }, now = new Date()) {
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const days = Math.round((start(now) - start(date)) / 86_400_000)
  if (days <= 0) return labels.today
  if (days === 1) return labels.yesterday
  if (days < 7) return capitalize(new Intl.DateTimeFormat(language, { weekday: 'long' }).format(date))
  return capitalize(new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'short' }).format(date))
}
