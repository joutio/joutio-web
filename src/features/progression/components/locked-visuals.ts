/**
 * Traitement visuel unique d'un élément **verrouillé** — récompense ou badge.
 *
 * La **surface** (carte, tuile) est atténuée ; le **visuel** (aperçu, sceau) est fortement
 * estompé et désaturé. Le contenu reste reconnaissable sans concurrencer ce qui est acquis.
 * Une seule source pour que les deux surfaces ne divergent pas.
 */
export const LOCKED_SURFACE_CLASS = "opacity-80"
export const LOCKED_VISUAL_CLASS = "opacity-45 grayscale"
