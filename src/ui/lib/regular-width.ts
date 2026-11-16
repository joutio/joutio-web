import { createContext, useContext } from 'react'

/**
 * Largeur « regular » (2026-11-16) : l'écran ne se contente plus de la composition téléphone (rail de navigation à
 * gauche, écrans clés en deux volets). Il faut au moins `REGULAR_WIDTH` de large **et** une orientation paysage : le
 * cadre web (iPhone Duo ouvert en paysage, 890 × 626) et une tablette en paysage. Une tablette en portrait garde la
 * composition téléphone, dans le Duo ouvert en portrait, 626 × 890 (`WebFrame`). `WebFrame` en décide, le fournit par ce contexte et
 * pose `data-jo-regular` sur l'écran pour la variante CSS `jo-regular:`.
 */
export const REGULAR_WIDTH = 700

export const RegularContext = createContext(false)

/** Vrai dans un écran en largeur « regular ». Faux sur les téléphones du lab et en web compact. */
export function useRegular() {
  return useContext(RegularContext)
}
