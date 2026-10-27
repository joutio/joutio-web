/** Cible interne uniquement (pas d'open redirect), conservée entre auth et onboarding. */
export function sanitizeReturnTo(
  value: string | null | undefined
): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    // Évite une boucle si quelqu'un forge `returnTo=/onboarding`.
    if (url.pathname === "/onboarding") return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function isRoomTarget(value: string | null): boolean {
  return !!value && (value.startsWith("/join/") || value.startsWith("/rooms/"))
}

/** Room/game : parcours prioritaire, jamais interrompu par l'onboarding. */
export function isRoomFlowPath(pathname: string): boolean {
  return /^\/(join|rooms|game)\//.test(pathname)
}

/** Le flag serveur fait foi ; les parties humaines déjà jouées le valent implicitement. */
type OnboardingState = {
  onboardingCompleted?: boolean
  stats: { played: number }
}

export function hasCompletedOnboarding(
  me: OnboardingState | undefined
): boolean {
  return !!me && (me.onboardingCompleted === true || me.stats.played > 0)
}
