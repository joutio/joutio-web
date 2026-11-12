import type { ActivityView } from '@joutio/client-domain/api-types'
import type { MessageKey } from '@/lib/i18n'
import type { StreakCalendarProps, StreakDay } from '@/ui'

type T = (key: MessageKey, values?: Record<string, string | number>) => string

/** `YYYY-MM-DD` d'une date locale (fuseau du navigateur, celui de l'activité du profil). */
export const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Lundi = 0. */
const weekday = (date: Date) => (date.getDay() + 6) % 7

const playedDays = (activity: ActivityView | undefined) => new Set((activity?.days ?? []).filter((day) => day.games > 0).map((day) => day.date))

/**
 * Semaine en cours, du lundi au dimanche. Un jour passé sans duel n'est « manqué » qu'après un premier jour joué de
 * la fenêtre : un nouveau joueur ne voit pas de croix (comme le mobile).
 */
export function weekOf(activity: ActivityView | undefined, now = new Date()): StreakDay[] {
  const played = playedDays(activity)
  const first = [...played].sort()[0]
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday(now))
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
    const key = isoDay(day)
    if (played.has(key)) return 'done'
    if (key === isoDay(now)) return 'today'
    if (day > now) return 'future'
    return first && key > first ? 'missed' : 'future'
  })
}

/** Phrase sous le compteur : ce qu'il faut faire aujourd'hui, ou le record une fois la journée comptée. */
export function streakHint(activity: ActivityView | undefined, t: T, now = new Date()) {
  const count = activity?.currentStreak ?? 0
  if (count === 0) return t('streak.start')
  if (!playedDays(activity).has(isoDay(now))) return t('streak.keep', { next: count + 1 })
  return t('streak.record', { count: activity?.longestStreak ?? count })
}

/** Calendrier du mois courant. */
export function calendarOf(activity: ActivityView | undefined, t: T, language: string, now = new Date()): StreakCalendarProps {
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const prefix = isoDay(first).slice(0, 8)
  const active = [...playedDays(activity)].filter((date) => date.startsWith(prefix)).map((date) => Number(date.slice(8)))
  const label = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(first)
  return {
    month: label.charAt(0).toUpperCase() + label.slice(1),
    legend: t(active.length > 1 ? 'streak.activeMany' : 'streak.activeOne', { count: active.length }),
    offset: weekday(first),
    days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    today: now.getDate(),
    active,
  }
}
