import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SIDEBAR_STORAGE_KEY = "joutio-sidebar"

/**
 * Préférence d'ouverture de la sidebar persistée. Le provider shadcn reste piloté
 * (`open`/`onOpenChange`) depuis `AppShell` ; ce store est la source unique de
 * l'état desktop (le drawer mobile reste éphémère).
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      open: true,
      setOpen: (open) => set({ open }),
      toggle: () => set({ open: !get().open }),
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      partialize: (state) => ({ open: state.open }),
    }
  )
)
