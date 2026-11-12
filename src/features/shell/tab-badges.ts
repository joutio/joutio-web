import { create } from 'zustand'
import type { TabKey } from './tabs'

/**
 * Pastilles de la bottom nav, posées par les features qui les connaissent (défis reçus en attente) : le shell ne
 * dépend d'aucune feature métier.
 */
export const useTabBadges = create<{ badges: Partial<Record<TabKey, number>>; set: (tab: TabKey, count: number) => void }>((set) => ({
  badges: {},
  set: (tab, count) => set((state) => (state.badges[tab] === count ? state : { badges: { ...state.badges, [tab]: count } })),
}))
