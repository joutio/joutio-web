import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Onglet d'une page porté par l'URL (`?tab=badges`) : un retour depuis une page ouverte à partir d'un onglet retombe
 * sur le bon onglet, et l'adresse partagée l'ouvre. `values` à `null` : onglets dynamiques, la valeur lue est validée par l'appelant. L'onglet par défaut n'apparaît pas dans l'URL ; changer d'onglet
 * remplace l'entrée d'historique (pas de pile d'onglets) et conserve les autres paramètres.
 */
export function useTabParam<T extends string>(values: readonly T[] | null, fallback: T, key = 'tab'): readonly [T, (tab: T) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)
  const tab = raw !== null && (values === null || (values as readonly string[]).includes(raw)) ? (raw as T) : fallback
  const setTab = useCallback(
    (next: T) =>
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous)
          if (next === fallback) updated.delete(key)
          else updated.set(key, next)
          return updated
        },
        { replace: true },
      ),
    [fallback, key, setParams],
  )
  return [tab, setTab]
}
