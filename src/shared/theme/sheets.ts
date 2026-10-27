/**
 * Detents des bottom sheets Arc UI — contrat responsive (responsive-sizing.md).
 * Aucun écran ne recopie de valeurs numériques locales : on choisit un preset.
 */
export const SHEET_DETENTS = {
  /**
   * Filtres de catalogue (Sujets, Social) : quasi plein cadre, hauteur unique et non
   * réductible — l'action « Voir les résultats » ne peut jamais être masquée par un scroll
   * ou une réduction de la feuille (même comportement que les sheets de défi/review).
   */
  filters: [0.92],
  /** Filtres de classement : quasi plein cadre, hauteur unique et non réductible (idem filtres). */
  leaderboard: [0.92],
  /** Picker quasi plein cadre (emoji). */
  picker: [0.85, 0.96],
  /** Review de duel : plein cadre permanent. */
  review: [0.95],
  /** Partage social : QR + actions, hauteur compacte. */
  share: [0.62],
  /** Confirmation (abandon…) : courte, titre + phrase + actions. */
  confirm: [0.45],
  /** Suppression de compte : avertissement complet + OTP, sans troncature en compact. */
  accountDeletion: [0.92],
  /** Fiche d'un badge (médaille, critère d'obtention, progression) : hauteur compacte. */
  badge: [0.6],
  /**
   * Défi / duel (lancer, choisir un thème) : quasi plein cadre, hauteur unique et non
   * réductible — le footer d'actions reste toujours visible (au plus petit detent il
   * descendrait sous le viewport) et la liste de recherche dispose du maximum de hauteur.
   */
  duel: [0.94],
} satisfies Record<string, number[]>
