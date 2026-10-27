/** Palette figée de l'écran de résultat (fond duel sombre). */
export const RESULT_WHITE = "#ffffff"
export const RESULT_LOSS = "var(--loss)"

/**
 * Rouge de l'anneau de maîtrise (segment « XP gagnée » + callout) : le rouge du bouton Rejouer
 * (`--loss`) éclairci de 40 % de blanc — exactement la teinte de la maquette (anneau `#fe9896`
 * pour un bouton `#ff5454`), donc harmonisé par construction avec le bouton.
 */
export const RESULT_XP = "color-mix(in srgb, var(--loss) 60%, #ffffff)"
