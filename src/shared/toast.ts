import { create } from 'zustand'
import type { ToastTone } from '@/ui'

type ToastItem = { id: number; tone: ToastTone; title: string; description?: string }

const DURATION_MS = 2500
let sequence = 0

export const useToastStore = create<{ current: ToastItem | null; show: (toast: Omit<ToastItem, 'id'>) => void; hide: (id: number) => void }>((set) => ({
  current: null,
  show: (toast) => {
    const id = ++sequence
    set({ current: { ...toast, id } })
    window.setTimeout(() => set((state) => (state.current?.id === id ? { current: null } : state)), DURATION_MS)
  },
  hide: (id) => set((state) => (state.current?.id === id ? { current: null } : state)),
}))

/** Toast global (un à la fois, 2,5 s), placé comme dans le lab : en haut de l'écran, en haut à droite au-delà de 640 px. */
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().show({ tone: 'success', title, description }),
  error: (title: string, description?: string) => useToastStore.getState().show({ tone: 'danger', title, description }),
}
