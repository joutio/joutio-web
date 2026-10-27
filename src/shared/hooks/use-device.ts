import { useSyncExternalStore } from "react"
import { DEVICE } from "@/shared/theme/tokens"

/** Classes de device du contrat responsive (cf. best-practices/.frontend/responsive-sizing.md). */
export type DeviceClass = "compact" | "tablet" | "desktop"

const COMPACT_QUERY = `(max-width: ${DEVICE.compact - 1}px)`
const DESKTOP_QUERY = `(min-width: ${DEVICE.desktop}px)`

function readDevice(): DeviceClass {
  if (window.matchMedia(COMPACT_QUERY).matches) return "compact"
  if (window.matchMedia(DESKTOP_QUERY).matches) return "desktop"
  return "tablet"
}

function subscribe(onChange: () => void): () => void {
  const compact = window.matchMedia(COMPACT_QUERY)
  const desktop = window.matchMedia(DESKTOP_QUERY)
  compact.addEventListener("change", onChange)
  desktop.addEventListener("change", onChange)
  return () => {
    compact.removeEventListener("change", onChange)
    desktop.removeEventListener("change", onChange)
  }
}

/** Classe de device courante (compact / tablet / desktop), réactive au redimensionnement. */
export function useDevice(): DeviceClass {
  return useSyncExternalStore(subscribe, readDevice, () => "desktop")
}

/**
 * Layout tactile : compact + tablette (< 1024 px). Pilote la nav basse, les bottom sheets
 * et les cibles >= 44 px. Le desktop garde la densité compacte.
 */
export function useIsTouchLayout(): boolean {
  return useDevice() !== "desktop"
}
