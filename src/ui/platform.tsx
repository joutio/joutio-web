import { createContext, useContext } from 'react'

/** Cible de rendu d'une composition : l'app native (Expo) ou l'app web (React DOM). */
export type Platform = 'native' | 'web'

/**
 * Plateforme courante. Une composition ne branche dessus que pour un écart réel entre natif et web
 * (prompt de suivi, partage, permissions) : jamais pour forker un écran.
 */
export const PlatformContext = createContext<Platform>('native')

export const usePlatform = () => useContext(PlatformContext)
