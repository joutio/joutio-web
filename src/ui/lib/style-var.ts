/**
 * Écrit une variable CSS en ligne, seulement si sa valeur change. Pendant un défilement, toute écriture invalide le style
 * de l'élément et de ses descendants : on écrit donc sur l'élément qui lit la variable, jamais sur un ancêtre du contenu
 * qui défile, et on n'écrit que ce qui change. Sur un CPU mobile, sinon, les surfaces se repeignent avec du retard.
 */
export function setStyleVar(element: HTMLElement | null | undefined, name: string, value: string): void {
  if (element && element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
}

/** Défilement piloté par CSS (`animation-timeline`) : calculé par le compositeur, sans JS. */
export const supportsScrollTimeline = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()')
