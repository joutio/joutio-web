export interface ScrollSample {
  /** Position verticale courante du conteneur (px). */
  scrollTop: number
  /** Delta depuis le dernier échantillon (px, positif vers le bas). */
  delta: number
}

/** Échantillon de détection d'une remise en page du contenu. */
export interface RelayoutSample {
  /** Hauteur totale du contenu du conteneur (px). */
  scrollHeight: number
  /** Hauteur totale de l'échantillon précédent (`null` au premier échantillon). */
  previousScrollHeight: number | null
}

const HIDE_AFTER_PX = 72
const TOP_THRESHOLD_PX = 8
const DIRECTION_THRESHOLD_PX = 4

/**
 * Le contenu est passé sous le chrome haut : le verre dépoli de la topbar et des bandeaux
 * collants peut s'activer (scrollEdgeAppearance iOS). En dessous du seuil, le chrome reste
 * en surface pleine — il n'y a rien à flouter.
 */
export function isScrolled(scrollTop: number): boolean {
  return scrollTop > TOP_THRESHOLD_PX
}

/**
 * Machine à états du masquage d'en-tête façon natif : caché en descendant après un seuil,
 * révélé dès que l'on remonte ou que l'on revient en haut. Le seuil de direction (hystérésis)
 * évite le scintillement du scroll inertiel.
 */
export function nextHeaderHidden(
  hidden: boolean,
  sample: ScrollSample
): boolean {
  if (sample.scrollTop <= TOP_THRESHOLD_PX) return false
  if (sample.delta >= DIRECTION_THRESHOLD_PX) {
    return sample.scrollTop > HIDE_AFTER_PX
  }
  if (sample.delta <= -DIRECTION_THRESHOLD_PX) return false
  return hidden
}

/**
 * Contenu **remis en page** entre deux échantillons : changement d'onglet, filtrage, liste plus
 * courte, page de résultats ajoutée, image chargée. Le navigateur rogne alors la position au
 * nouveau maximum (**où** exactement dépend de l'ancrage de scroll du navigateur — jamais
 * prévisible) ou la ré-ancre, et émet un `scroll` qui n'est **pas un geste** : un clic sur un
 * onglet ne doit pas faire apparaître la topbar et la nav basse. Le geste suivant recale l'état.
 */
export function isRelayout(sample: RelayoutSample): boolean {
  return (
    sample.previousScrollHeight !== null &&
    sample.scrollHeight !== sample.previousScrollHeight
  )
}
