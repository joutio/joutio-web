import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

interface Options {
  /** `true` (défaut) : ne crée pas d'entrée d'historique — le retour revient à l'écran précédent
   * en conservant l'état courant. `false` : ajoute une entrée (navigation avant/arrière dans les
   * états). */
  replace?: boolean
}

/**
 * État **persisté dans l'URL** (onglet / filtre) : l'écran est restauré à l'identique lors d'un
 * retour (`POP`) et le lien est partageable. La valeur par défaut est retirée de l'URL pour garder
 * des liens propres.
 */
export function useUrlParam<T extends string>(
  key: string,
  defaultValue: T,
  options: Options = {}
): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams()
  const replace = options.replace ?? true
  const value = (params.get(key) as T | null) ?? defaultValue

  const set = useCallback(
    (next: T) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current)
          if (next === defaultValue || next === "") updated.delete(key)
          else updated.set(key, next)
          return updated
        },
        { replace }
      )
    },
    [key, defaultValue, replace, setParams]
  )

  return [value, set]
}

/**
 * Mutateur **atomique** de plusieurs paramètres d'URL (une seule navigation). À utiliser quand
 * un contrôle en change plusieurs d'un coup (« Tout effacer », filtre + reset de pagination) :
 * des appels successifs à `useUrlParam` partagent la même base de render et le dernier
 * écraserait les précédents.
 */
export function useUrlParams(): (
  mutate: (params: URLSearchParams) => void,
  options?: Options
) => void {
  const [, setParams] = useSearchParams()
  return useCallback(
    (mutate, options = {}) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current)
          mutate(updated)
          return updated
        },
        { replace: options.replace ?? true }
      )
    },
    [setParams]
  )
}

/** Variante booléenne (paramètre absent = `defaultValue`). */
export function useUrlParamBool(
  key: string,
  defaultValue = false,
  options: Options = {}
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useUrlParam(
    key,
    defaultValue ? "true" : "false",
    options
  )
  return [
    value === "true",
    (next: boolean) => setValue(next ? "true" : "false"),
  ]
}

/** Variante entière (paramètre absent ou invalide = `defaultValue`). */
export function useUrlParamNumber(
  key: string,
  defaultValue = 0,
  options: Options = {}
): [number, (value: number) => void] {
  const [value, setValue] = useUrlParam(key, String(defaultValue), options)
  const parsed = Number.parseInt(value, 10)
  return [
    Number.isFinite(parsed) ? parsed : defaultValue,
    (next: number) => setValue(String(next)),
  ]
}
