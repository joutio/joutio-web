import { create } from 'zustand'

export interface ShareRequest {
  /** Lien universel `go.joutio.com/…`. */
  url: string
  /** Phrase d'accompagnement (feuille du système, copie). */
  text: string
  /** Titre de la feuille web. */
  title: string
}

/** Feuille « Partager » du web (une à la fois), rendue par `ShareHost` dans le cadre de l'app. */
export const useShareStore = create<{ current: ShareRequest | null; open: (request: ShareRequest) => void; close: () => void }>((set) => ({
  current: null,
  open: (request) => set({ current: request }),
  close: () => set({ current: null }),
}))
