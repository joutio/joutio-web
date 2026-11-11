import { create } from 'zustand'
import type { CategoryCode } from '@/ui'

export const MAX_UNIVERSES = 3

/** Étapes sans session (connexion) puis avec session tant que `onboardingCompleted` est faux. */
export type OnboardingStep = 'login' | 'code' | 'universes' | 'notifications' | 'first'

/** Brouillon du parcours d'entrée, en mémoire : étape, e-mail saisi, univers choisis, saut du premier thème. */
interface OnboardingState {
  step: OnboardingStep
  email: string
  universes: CategoryCode[]
  /** « Passer » sur Univers : pas de premier thème. */
  skipped: boolean
  go: (step: OnboardingStep) => void
  setEmail: (email: string) => void
  setUniverses: (universes: CategoryCode[]) => void
  setSkipped: (skipped: boolean) => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 'login',
  email: '',
  universes: [],
  skipped: false,
  go: (step) => set({ step }),
  setEmail: (email) => set({ email }),
  setUniverses: (universes) => set({ universes: universes.slice(0, MAX_UNIVERSES) }),
  setSkipped: (skipped) => set({ skipped }),
}))
