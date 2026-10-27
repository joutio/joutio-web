import { createContext } from "react"
import type { RefObject } from "react"

/** Réf du conteneur de scroll applicatif (le document ne défile jamais). */
export const ScrollContainerContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null)
