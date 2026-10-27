import { useEffect } from "react"
import {
  preloadImages,
  type PreloadImagesOptions,
} from "@/shared/utils/image-preload"

/**
 * Précharge les visuels d'une liste dès que les données sont disponibles (dédupliqué et borné).
 * Passer un tableau **stable** (données React Query ou `useMemo`) pour éviter des effets inutiles.
 */
export function usePreloadImages(
  urls: readonly (string | null | undefined)[],
  { limit = 8, priority = "low" }: PreloadImagesOptions = {}
): void {
  useEffect(() => {
    preloadImages(urls, { limit, priority })
  }, [urls, limit, priority])
}
