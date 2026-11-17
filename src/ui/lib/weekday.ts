import { formatDate } from '@joutio/client/i18n'

/** Jour `index` de la semaine (0 = lundi) dans la langue de l'app : `narrow` (« L ») ou `long` (« lundi »). */
export const weekdayName = (index: number, language: string, weekday: 'narrow' | 'long') =>
  // Le 1er janvier 2024 est un lundi.
  formatDate(new Date(2024, 0, 1 + index), language, { weekday })
