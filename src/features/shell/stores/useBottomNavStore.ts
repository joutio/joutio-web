import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { BottomNavVariant } from "@/components/ui/bottom-nav-bar"

interface BottomNavState {
  /** Habillage de la nav basse mobile : pilule flottante ou barre fixe pleine largeur. */
  variant: BottomNavVariant
  setVariant: (variant: BottomNavVariant) => void
}

const BOTTOM_NAV_STORAGE_KEY = "joutio-bottom-nav"

/**
 * Préférence d'habillage de la nav basse (mobile). Persistée ; l'application au DOM
 * (`data-bottom-nav` sur `<html>`) est portée par `AppShell`, source unique des offsets CSS.
 */
export const useBottomNavStore = create<BottomNavState>()(
  persist(
    (set) => ({
      variant: "fixed",
      setVariant: (variant) => set({ variant }),
    }),
    {
      name: BOTTOM_NAV_STORAGE_KEY,
      version: 2,
      // Bascule unique : les préférences historiques (`floating`) suivent le nouveau défaut
      // produit. Les choix effectués après cette migration restent persistés tels quels.
      migrate: () => ({ variant: "fixed" }),
      partialize: (state) => ({ variant: state.variant }),
    }
  )
)
