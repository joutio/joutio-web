import { create } from "zustand"

interface ChromeState {
  /**
   * Chrome haut (topbar) replié par le geste de scroll. État **hors React** pour la topbar et les
   * bandes collantes (attribut CSS) ; ce store ne sert qu'aux composants React qui doivent encore
   * changer d'état (nav basse).
   */
  hidden: boolean
  setHidden: (hidden: boolean) => void
}

export const useChromeStore = create<ChromeState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}))
