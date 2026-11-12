import { useCallback } from 'react'
import { useT } from '@/lib/i18n'

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Délai découpé pour l'affichage : en jours au-delà de 2 jours, en heures au-delà d'une heure, sinon en minutes. */
export function durationParts(ms: number): { unit: 'days' | 'hours' | 'minutes'; count: number } {
  const value = Math.max(0, ms)
  if (value >= 2 * DAY) return { unit: 'days', count: Math.floor(value / DAY) }
  if (value >= HOUR) return { unit: 'hours', count: Math.floor(value / HOUR) }
  return { unit: 'minutes', count: Math.max(1, Math.floor(value / 60_000)) }
}

/** « 23 h », « 45 min », « 3 j » dans la langue de l'app (échéance d'un défi, d'un salon). */
export function useDuration() {
  const t = useT()
  return useCallback(
    (ms: number) => {
      const { unit, count } = durationParts(ms)
      return t(unit === 'days' ? 'duration.days' : unit === 'hours' ? 'duration.hours' : 'duration.minutes', { count })
    },
    [t],
  )
}
