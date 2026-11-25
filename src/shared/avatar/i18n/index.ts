import { avatarLabel } from '@joutio/client/core/i18n'
import { useLanguageStore } from '@/lib/i18n'

/** Libellé d'une clé `avatar.…` dans la langue de l'app (`{{number}}` interpolé) : dictionnaire de `@joutio/client`. */
export const t = (key: string, vars: Record<string, string | number> = {}): string => avatarLabel(useLanguageStore.getState().language, key, vars)
