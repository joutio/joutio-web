import { create } from "zustand"

interface SentRematchState {
  /** Défis de revanche envoyés depuis l'écran de résultat (10 s d'attente). */
  challengeIds: string[]
  add: (challengeId: string) => void
  remove: (challengeId: string) => void
  clear: () => void
}

/**
 * Registre des revanches **envoyées** : il permet à l'inbox de ne pas doubler le toast d'issue
 * (`CHALLENGE_DECLINED`) avec celui du bouton de résultat. Vidé au démontage de l'écran.
 */
export const useSentRematchStore = create<SentRematchState>()((set) => ({
  challengeIds: [],
  add: (challengeId) =>
    set((state) =>
      state.challengeIds.includes(challengeId)
        ? state
        : { challengeIds: [...state.challengeIds, challengeId] }
    ),
  remove: (challengeId) =>
    set((state) => ({
      challengeIds: state.challengeIds.filter((id) => id !== challengeId),
    })),
  clear: () => set({ challengeIds: [] }),
}))

/** Vrai si ce défi est une revanche envoyée par l'écran de résultat courant. */
export function isSentRematch(challengeId: string | null): boolean {
  if (!challengeId) return false
  return useSentRematchStore.getState().challengeIds.includes(challengeId)
}
