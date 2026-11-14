import type { Language } from '@joutio/client-domain/api-types'
import { useLocation } from 'react-router-dom'
import { TABS, type TabKey } from '@/features/shell'
import type { MessageKey } from '@/lib/i18n'
import type { ThemePreference } from '@/lib/theme'

export const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

export const APPEARANCE: readonly { value: ThemePreference; label: MessageKey }[] = [
  { value: 'dark', label: 'settings.dark' },
  { value: 'light', label: 'settings.light' },
  { value: 'system', label: 'settings.system' },
]

/** Nom de chaque langue dans sa propre langue, comme le lab. */
export const LANGUAGES: readonly { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

/** Origine des Réglages : onglet dont la roue dentée les a ouverts (Profil par défaut), gardé d'une page à l'autre. */
export type SettingsOrigin = TabKey

export function useSettingsOrigin(): SettingsOrigin {
  const state = useLocation().state as { from?: string } | null
  return TABS.find((tab) => tab.key === state?.from)?.key ?? 'profile'
}
