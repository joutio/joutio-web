import { create } from "zustand"
import { persist } from "zustand/middleware"

interface MatchmakingPreferencesState {
  /**
   * Après expiration de la recherche (10 s), lance automatiquement un entraînement bot en
   * difficulté normale. Désactivé : la popup « Aucun adversaire » reste proposée.
   */
  autoTrainOnTimeout: boolean
  setAutoTrainOnTimeout: (enabled: boolean) => void
}

const MATCHMAKING_PREFERENCES_KEY = "joutio-matchmaking-preferences"

/**
 * Préférences d'appariement (locales au navigateur pour le MVP). Le défaut est **activé** :
 * un joueur sans adversaire entre immédiatement en entraînement plutôt que d'enchaîner les
 * clics. L'entraînement reste sans XP et sans série, rappelé dans l'interface.
 */
export const useMatchmakingPreferencesStore =
  create<MatchmakingPreferencesState>()(
    persist(
      (set) => ({
        autoTrainOnTimeout: true,
        setAutoTrainOnTimeout: (enabled) =>
          set({ autoTrainOnTimeout: enabled }),
      }),
      {
        name: MATCHMAKING_PREFERENCES_KEY,
        version: 1,
        partialize: (state) => ({
          autoTrainOnTimeout: state.autoTrainOnTimeout,
        }),
      }
    )
  )
