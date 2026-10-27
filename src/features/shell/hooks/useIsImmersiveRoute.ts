import { useLocation } from "react-router-dom"

/** Routes d'immersion (duel, salle d'attente, rejoindre un salon) rendues dans le shell. */
export const IMMERSIVE_PREFIXES = [
  "/game/",
  "/matchmaking/",
  "/rooms/",
  "/join/",
]

/** Vrai lorsque la route courante est un écran d'immersion. */
export function useIsImmersiveRoute(): boolean {
  const { pathname } = useLocation()
  return IMMERSIVE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
