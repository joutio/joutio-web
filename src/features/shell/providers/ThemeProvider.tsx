import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useThemeStore } from "../stores/useThemeStore"
import { useIsImmersiveRoute } from "../hooks/useIsImmersiveRoute"
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
} from "./theme-context"

const MEDIA = "(prefers-color-scheme: dark)"

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MEDIA).matches
}

/**
 * Source unique du thème : résout la préférence (immersion + système), applique la classe
 * `.dark` sur `<html>` (seul écrivain DOM) et suit la préférence système.
 *
 * L'immersion est **dérivée de la route** (et non d'un flag monté/démonté par écran), ce qui
 * supprime tout état intermédiaire au retour d'un duel ou d'une salle.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const isImmersive = useIsImmersiveRoute()
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const media = window.matchMedia(MEDIA)
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const resolvedTheme: ResolvedTheme = isImmersive
    ? "dark"
    : theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    // Arc UI (bottom sheets) lit `data-theme="dark"` — en plus de `.dark` (Tailwind/tokens app).
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
    // Barre d'état PWA/Chrome : suit le thème résolu (y compris l'immersion duel → sombre).
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff"
      )
  }, [resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
