/** URLs déjà préchargées : une seule requête par image, quel que soit le nombre d'appels. */
const preloaded = new Set<string>()

export type PreloadPriority = "high" | "low" | "auto"

export interface PreloadImagesOptions {
  /** Nombre maximum d'images préchargées (les `null` ne comptent pas). */
  limit?: number
  /** Priorité réseau — `low` pour les visuels de listes, `high` pour un écran imminent. */
  priority?: PreloadPriority
}

/**
 * Précharge une image hors du cycle React : le navigateur la met en cache (puis le Service
 * Worker) avant qu'elle ne soit affichée. Les connexions faibles ne sont pas pénalisées.
 */
export function preloadImage(
  url: string | null | undefined,
  priority: PreloadPriority = "high"
): void {
  if (!url || preloaded.has(url)) return
  preloaded.add(url)
  const image = new Image()
  image.fetchPriority = priority
  image.decoding = "async"
  image.src = url
}

/** Précharge une liste d'URLs (dédupliquée, bornée par `limit`). */
export function preloadImages(
  urls: Iterable<string | null | undefined>,
  { limit = 8, priority = "low" }: PreloadImagesOptions = {}
): void {
  let count = 0
  for (const url of urls) {
    if (count >= limit) break
    if (!url) continue
    preloadImage(url, priority)
    count += 1
  }
}
