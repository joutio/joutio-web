import { useContext } from "react"
import { ScrollContainerContext } from "@/shared/context/scroll-container"

/** Conteneur de scroll de la coquille (`null` hors `AppShell`). */
export function useScrollContainer() {
  return useContext(ScrollContainerContext)
}
