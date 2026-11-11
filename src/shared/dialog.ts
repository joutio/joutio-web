import { create } from 'zustand'
import type { DialogProps } from '@/ui'

export type DialogRequest = Omit<DialogProps, 'open' | 'onClose'>

/** Dialogue global (un à la fois), rendu par `DialogHost` dans le cadre de l'app ; une action ferme le dialogue. */
export const useDialogStore = create<{ current: DialogRequest | null; show: (dialog: DialogRequest) => void; close: () => void }>((set) => ({
  current: null,
  show: (dialog) => set({ current: dialog }),
  close: () => set({ current: null }),
}))

export const showDialog = (dialog: DialogRequest) => useDialogStore.getState().show(dialog)
