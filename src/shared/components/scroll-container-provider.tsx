import type { ReactNode, RefObject } from "react"
import { ScrollContainerContext } from "@/shared/context/scroll-container"

interface ScrollContainerProviderProps {
  containerRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

/** Expose le conteneur de scroll de la coquille (observers, scroll-to-top). */
export function ScrollContainerProvider({
  containerRef,
  children,
}: ScrollContainerProviderProps) {
  return (
    <ScrollContainerContext.Provider value={containerRef}>
      {children}
    </ScrollContainerContext.Provider>
  )
}
