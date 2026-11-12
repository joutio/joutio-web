import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'
import type { ToastTone } from '@/ui'

/*
 * Toasts (`toast.md`) : pile de 3 au plus, le plus récent devant ; mise à jour en place par identifiant ; 4 s, minuterie
 * relancée à chaque mise à jour et suspendue tant que la pile est dépliée ; pendant un écran immersif (duel), les
 * messages attendent la fin de la suspension.
 */
export const TOAST_DURATION_MS = 4000
/** Durée de la sortie (remonte et s'efface). */
export const TOAST_EXIT_MS = 200
export const TOAST_VISIBLE = 3

export type ToastMessage = {
  /** Même identifiant : le toast est mis à jour en place au lieu d'en empiler un autre. */
  id?: string
  tone?: ToastTone
  /** Requis sans `content`. */
  title?: string
  description?: string
  /** Toute la surface est touchable (chevron) ; aucun bouton d'action séparé. */
  onClick?: () => void
  /** Rendu propre (ex. notification avec l'avatar du joueur) ; remplace le `Toast` standard. */
  content?: ReactNode
  /** En ms ; 4 s par défaut. */
  duration?: number
}

export type ToastEntry = ToastMessage & {
  id: string
  /** Change à chaque mise à jour : relance la minuterie. */
  version: number
  leaving: boolean
}

type ToastStore = {
  toasts: ToastEntry[]
  /** Reçus pendant un écran immersif : affichés à la fin de la suspension. */
  pending: ToastEntry[]
  /** Écrans immersifs (duel) montés (`useToastSuppression`). */
  suppressed: number
  expanded: boolean
  show: (message: ToastMessage) => string
  dismiss: (id?: string) => void
  setExpanded: (expanded: boolean) => void
}

let sequence = 0
const MAX_KEPT = TOAST_VISIBLE + 3

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  pending: [],
  suppressed: 0,
  expanded: false,
  show: (message) => {
    const id = message.id ?? `toast-${++sequence}`
    const target = get().suppressed > 0 ? 'pending' : 'toasts'
    const list = get()[target]
    const existing = list.find((entry) => entry.id === id && !entry.leaving)
    const entry: ToastEntry = { ...message, id, version: (existing?.version ?? 0) + 1, leaving: false }
    // Le plus récent devant ; une mise à jour garde sa place dans la pile. Au-delà, les plus anciens disparaissent.
    const next = existing ? list.map((item) => (item === existing ? entry : item)) : [entry, ...list.filter((item) => item.id !== id)]
    set({ [target]: next.slice(0, MAX_KEPT) })
    return id
  },
  dismiss: (id) => {
    const leaving = get().toasts.filter((entry) => !entry.leaving && (id === undefined || entry.id === id))
    if (leaving.length === 0) return
    const ids = new Set(leaving.map((entry) => entry.id))
    set((state) => ({ toasts: state.toasts.map((entry) => (ids.has(entry.id) ? { ...entry, leaving: true } : entry)) }))
    window.setTimeout(
      () =>
        set((state) => {
          const toasts = state.toasts.filter((entry) => !(ids.has(entry.id) && entry.leaving))
          return { toasts, expanded: state.expanded && toasts.filter((entry) => !entry.leaving).length > 1 }
        }),
      TOAST_EXIT_MS,
    )
  },
  setExpanded: (expanded) => set({ expanded }),
}))

type ToastOptions = Omit<ToastMessage, 'title' | 'tone' | 'description' | 'content'>
const typed =
  (tone: ToastTone) =>
  (title: string, description?: string, options?: ToastOptions): string =>
    useToastStore.getState().show({ ...options, tone, title, description })

/** API impérative : `toast.show({ … })` ou raccourcis par ton (`toast.success(titre, description?, { id })`). */
export const toast = {
  show: (message: ToastMessage) => useToastStore.getState().show(message),
  success: typed('success'),
  error: typed('danger'),
  warning: typed('warning'),
  info: typed('neutral'),
  /** Sans identifiant : ferme tous les toasts. */
  dismiss: (id?: string) => useToastStore.getState().dismiss(id),
}

/** Écran immersif (duel, intros) : aucun toast tant qu'il est monté ; les messages reçus attendent sa fermeture. */
export function useToastSuppression() {
  useEffect(() => {
    // Les toasts déjà affichés se ferment : ils ne rejouent pas après la partie.
    useToastStore.setState((state) => ({ suppressed: state.suppressed + 1, toasts: [], expanded: false }))
    return () =>
      useToastStore.setState((state) => {
        const suppressed = Math.max(0, state.suppressed - 1)
        return suppressed === 0 ? { suppressed, toasts: [...state.pending, ...state.toasts].slice(0, MAX_KEPT), pending: [] } : { suppressed }
      })
  }, [])
}
