import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'

/** Préférence de thème : système par défaut, réglage manuel (Réglages). Même clé que le script d'`index.html`. */
export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const KEY = 'joutio-theme'

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export const useThemeStore = create<{ preference: ThemePreference; setPreference: (preference: ThemePreference) => void }>((set) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    try {
      localStorage.setItem(KEY, preference)
    } catch {
      // Sans stockage, le choix vaut pour l'onglet.
    }
    set({ preference })
  },
}))

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
const subscribeSystem = (listener: () => void) => {
  const query = media()
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemeStore((state) => state.preference)
  const systemDark = useSyncExternalStore(subscribeSystem, () => media().matches, () => true)
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

/**
 * Applique le thème résolu sur `<html>` (`data-jo-theme`, comme le lab) et la couleur de la barre du navigateur. Les
 * écrans toujours sombres (duel, intros, déblocages, reconnexion) posent `data-jo-theme="dark"` sur leur sous-arbre.
 */
export function useApplyTheme(): void {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.joTheme = theme
    const background = getComputedStyle(document.documentElement).getPropertyValue('--jo-bg').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background || (theme === 'dark' ? '#000000' : '#F6F5F1'))
  }, [theme])
}
