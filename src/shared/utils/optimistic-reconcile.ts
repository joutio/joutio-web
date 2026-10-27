import type { QueryClient, QueryKey } from "@tanstack/react-query"

/**
 * Réconciliation d'une mutation optimiste avec une source de vérité **éventuellement cohérente**
 * (projections Axon différées, caches BFF répliqués).
 *
 * Anti-pattern remplacé : `onSettled -> setTimeout(2 s) -> invalidateQueries`. Une relecture qui
 * arrive avant la projection **écrase l'état optimiste** avec une valeur périmée ; ce résultat est
 * alors considéré frais (`staleTime`) et l'utilisateur doit recharger la page. Ici on relit via le
 * **service** (jamais `fetchQuery`, qui écrirait la valeur périmée dans le cache) jusqu'à observer
 * l'intention de la mutation, puis seulement on applique la réponse confirmée — sinon on invalide
 * en secours (la vérité serveur gagne).
 *
 * Voir `best-practices/.frontend/server-state.md` (section Mutations).
 */
export interface ReconcileUntilOptions<T> {
  /** Relit la source de vérité sans passer par le cache React Query. */
  read: () => Promise<T>
  /** Vrai quand la réponse serveur reflète l'intention de la mutation. */
  matches: (view: T) => boolean
  /** Plus aucune convergence possible (état terminal) : on abandonne sans attendre. */
  abort?: (view: T) => boolean
  /** Réponse confirmée : écriture `setQueryData` + invalidation des vues satellites. */
  onConverged?: (view: T) => void
  /** Convergence non observée dans le budget : invalidation de secours. */
  onTimeout?: () => void
  /** Nombre de lectures maximum (défaut 6). */
  attempts?: number
  /** Délai entre deux lectures (défaut 700 ms). */
  intervalMs?: number
  /** Injectable pour les tests. */
  sleep?: (ms: number) => Promise<void>
}

export const RECONCILE_ATTEMPTS = 6
export const RECONCILE_INTERVAL_MS = 700

/**
 * Boucle de convergence **bornée** : relit l'état serveur jusqu'à ce qu'il reflète l'intention,
 * sans jamais écrire une lecture périmée dans le cache. Retourne la vue convergée, ou `null` si
 * l'état est terminal (`abort`) ou le budget épuisé (`onTimeout` est alors appelé).
 */
export async function reconcileUntil<T>({
  read,
  matches,
  abort,
  onConverged,
  onTimeout,
  attempts = RECONCILE_ATTEMPTS,
  intervalMs = RECONCILE_INTERVAL_MS,
  sleep = defaultSleep,
}: ReconcileUntilOptions<T>): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const view = await read().catch(() => null)
    if (view !== null) {
      if (matches(view)) {
        onConverged?.(view)
        return view
      }
      if (abort?.(view)) return null
    }
    if (attempt < attempts - 1) {
      await sleep(intervalMs)
    }
  }
  onTimeout?.()
  return null
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fenêtre de projection Axon : une invalidation immédiate peut relire l'état précédent (ex. une
 * carte annulée qui réapparaît et semble exiger deux clics). Réservé aux mutations **sans état
 * prédictible à relire** (exception assumée à la convergence, cf. `useTopicAuthoring`) : partout
 * ailleurs, converger avec `reconcileUntil`.
 */
export const PROJECTION_RECONCILE_DELAY_MS = 2_000

/** Invalide des vues après la fenêtre de projection Axon — jamais immédiatement. */
export function scheduleInvalidate(
  queryClient: QueryClient,
  queryKeys: QueryKey[],
  delayMs = PROJECTION_RECONCILE_DELAY_MS
): void {
  setTimeout(() => {
    for (const queryKey of queryKeys) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }, delayMs)
}

/** Retrait optimiste des listes en cache : retire les éléments satisfaisant `matches`. */
export function removeMatchingFromList<Item>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  matches: (item: Item) => boolean
): void {
  queryClient.setQueryData<Item[]>(queryKey, (current) =>
    current?.filter((item) => !matches(item))
  )
}
