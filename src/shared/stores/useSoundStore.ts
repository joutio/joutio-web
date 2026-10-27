import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Réglage unique des sons de l'app (notifications, duel, résultat, succès). */
interface SoundState {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

/**
 * Préférence unique « sons de l'app » (notifications, duel, fin de duel, succès). La clé
 * persistée historique est conservée pour ne pas perdre le choix des utilisateurs existants.
 */
const SOUND_STORAGE_KEY = "joutio-notification-sound"

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: SOUND_STORAGE_KEY,
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
)
