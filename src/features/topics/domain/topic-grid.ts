const AUTO_FILL = "tablet-up:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]"

/**
 * Grille des sujets en **tuiles springboard**, à toutes les tailles : 3 ou 4 colonnes en
 * compact (réglage « Grille des sujets »), puis **auto-fill** dès 640 px (colonnes d'au moins
 * `6rem`) — les tuiles gardent ainsi une taille d'icône (~98-110 px) au lieu de s'étirer sur
 * les grands écrans, et ne se déforment pas quand la grille est presque vide (`auto-fill`
 * laisse les pistes vides, contrairement à `auto-fit`).
 */
export function topicGridClass(columns: 3 | 4): string {
  return columns === 3
    ? `grid grid-cols-3 ${AUTO_FILL} gap-x-1 gap-y-2 tablet-up:gap-3`
    : `grid grid-cols-4 ${AUTO_FILL} gap-x-1 gap-y-2 tablet-up:gap-3`
}
