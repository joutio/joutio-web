import { useCallback } from 'react'
import { create } from 'zustand'
import type { Language } from '@joutio/client/core/types'
import { translate, type MessageKey, type MessageValues } from '@joutio/client/core/i18n'

/**
 * Textes de l'app, en français et en anglais (`MeView.language`). Les dictionnaires et `translate` sont partagés avec
 * le mobile dans `@joutio/client/core/i18n` (ADR 0002) ; l'app ne garde que la langue courante et `useT`.
 */
export { translate, type MessageKey }

export const useLanguageStore = create<{ language: Language; setLanguage: (language: Language) => void }>((set) => ({
  // Français tant que `MeView.language` n'est pas connu : les composants du lab portent leurs textes français.
  language: 'fr',
  setLanguage: (language) => {
    document.documentElement.lang = language
    set({ language })
  },
}))

/** `t('clé', { valeur })` dans la langue courante. */
export function useT() {
  const language = useLanguageStore((state) => state.language)
  return useCallback((key: MessageKey, values?: MessageValues) => translate(language, key, values), [language])
}
