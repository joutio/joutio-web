import { useCallback } from 'react'
import { create } from 'zustand'
import type { Language } from '@joutio/client-domain/api-types'
import { en } from './en'
import { fr, type Messages } from './fr'

/**
 * Textes de l'app, en français et en anglais (`MeView.language`). Les textes français sont ceux du lab, mot pour mot.
 * Pas de bibliothèque : dictionnaires typés (`fr` fait foi, `en` doit avoir les mêmes clés) et interpolation `{nom}`.
 */
export type MessageKey = keyof Messages

const dictionaries: Record<Language, Messages> = { fr, en }

export const useLanguageStore = create<{ language: Language; setLanguage: (language: Language) => void }>((set) => ({
  // Français tant que `MeView.language` n'est pas connu : les composants du lab portent leurs textes français.
  language: 'fr',
  setLanguage: (language) => {
    document.documentElement.lang = language
    set({ language })
  },
}))

export function translate(language: Language, key: MessageKey, values?: Record<string, string | number>): string {
  const template = dictionaries[language][key] ?? fr[key]
  return values ? template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match)) : template
}

/** `t('clé', { valeur })` dans la langue courante. */
export function useT() {
  const language = useLanguageStore((state) => state.language)
  return useCallback((key: MessageKey, values?: Record<string, string | number>) => translate(language, key, values), [language])
}
