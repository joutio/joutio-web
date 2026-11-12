import { create } from 'zustand'

/**
 * Pourquoi la feuille s'ouvre : une limite atteinte remplace l'accroche par sa raison (`premium.md` § 2) — défis,
 * ou plafonds de création (`creation.md` § 3 : 2e sujet publié, 31e question, Équipe).
 */
export type PremiumReason = 'quota' | 'topics' | 'questions' | 'team' | undefined

const WAITLIST_KEY = 'joutio.premiumWaitlist'
const readWaitlist = () => {
  try {
    return localStorage.getItem(WAITLIST_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Feuille Premium, unique pour l'app (Réglages, éditeur d'avatar, limite de défis). L'offre n'est pas ouverte : état
 * Bientôt, inscription à la liste d'attente mémorisée sur l'appareil (aucun endpoint, comme le mobile).
 */
export const usePremiumSheet = create<{
  open: boolean
  reason: PremiumReason
  joined: boolean
  show: (reason?: PremiumReason) => void
  close: () => void
  join: () => void
}>((set) => ({
  open: false,
  reason: undefined,
  joined: readWaitlist(),
  show: (reason) => set({ open: true, reason }),
  close: () => set({ open: false }),
  join: () => {
    try {
      localStorage.setItem(WAITLIST_KEY, '1')
    } catch {
      // Stockage indisponible : l'inscription vaut pour la session.
    }
    set({ joined: true })
  },
}))

export const showPremium = (reason?: PremiumReason) => usePremiumSheet.getState().show(reason)
