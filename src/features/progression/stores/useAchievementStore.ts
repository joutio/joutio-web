import { create } from "zustand"
import { achievementKey, type Achievement } from "../domain/achievement"

interface AchievementState {
  /** File des déblocages à célébrer (le premier est affiché). */
  queue: Achievement[]
  /** Ajoute un déblocage (ignore un doublon déjà en file). */
  enqueue: (achievement: Achievement) => void
  /** Passe au déblocage suivant. */
  dismiss: () => void
  /** Vide la file (déconnexion). */
  clear: () => void
}

/**
 * File des **célébrations de déblocage** (éphémère, non persistée) : le flux temps réel y ajoute
 * chaque badge/titre gagné, l'overlay les affiche un par un. Les déblocages reçus pendant
 * une partie sont **conservés** puis célébrés à la sortie de l'écran immersif (écran de résultat).
 */
export const useAchievementStore = create<AchievementState>((set, get) => ({
  queue: [],
  enqueue: (achievement) => {
    const key = achievementKey(achievement)
    if (get().queue.some((item) => achievementKey(item) === key)) return
    set((state) => ({ queue: [...state.queue, achievement] }))
  },
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}))
