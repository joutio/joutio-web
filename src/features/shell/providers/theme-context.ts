import { createContext, useContext } from "react"
import type { Theme } from "../stores/useThemeStore"

export type ResolvedTheme = "light" | "dark"

export interface ThemeContextValue {
  /** Préférence choisie par l'utilisateur (light/dark/system). */
  theme: Theme
  /** Thème réellement appliqué (immersion + préférence système résolues). */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider")
  }
  return context
}
