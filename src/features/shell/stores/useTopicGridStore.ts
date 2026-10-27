import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TopicGridColumns = 3 | 4

interface TopicGridState {
  columns: TopicGridColumns
  setColumns: (columns: TopicGridColumns) => void
}

const TOPIC_GRID_STORAGE_KEY = "joutio-topic-grid"

export const useTopicGridStore = create<TopicGridState>()(
  persist(
    (set) => ({
      columns: 3,
      setColumns: (columns) => set({ columns }),
    }),
    {
      name: TOPIC_GRID_STORAGE_KEY,
      version: 2,
      // Bascule unique : l'ancien défaut (4 colonnes) migre vers le nouveau (3 colonnes).
      migrate: () => ({ columns: 3 }),
      partialize: (state) => ({ columns: state.columns }),
    }
  )
)
