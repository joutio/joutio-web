import { useEffect } from 'react'
import { create } from 'zustand'
import type { ToastTone } from '@/ui'

type ToastItem = { id: number; tone: ToastTone; title: string; description?: string }

const DURATION_MS = 2500
let sequence = 0

export const useToastStore = create<{
  current: ToastItem | null
  /** Écrans immersifs (duel) montés : aucun toast ne s'affiche (`useToastSuppression`). */
  suppressed: number
  show: (toast: Omit<ToastItem, 'id'>) => void
  hide: (id: number) => void
}>((set, get) => ({
  current: null,
  suppressed: 0,
  show: (toast) => {
    if (get().suppressed > 0) return
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
  info: (title: string, description?: string) => useToastStore.getState().show({ tone: 'neutral', title, description }),
}

/** Suspend les toasts tant que l'écran est monté (duel, intros : toujours plein écran, sans distraction). */
export function useToastSuppression() {
  useEffect(() => {
    useToastStore.setState((state) => ({ suppressed: state.suppressed + 1, current: null }))
    return () => useToastStore.setState((state) => ({ suppressed: state.suppressed - 1 }))
  }, [])
}
