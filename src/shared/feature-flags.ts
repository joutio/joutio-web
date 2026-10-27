export interface FeatureFlags {
  /**
   * Atelier sujet (création et gestion des thèmes/questions) — intégré aux pages Sujets et
   * fiche sujet. Désactivé jusqu'à la sortie du MVP ; réactiver = rebasculer ce flag.
   */
  topicAuthoring: boolean
}

/**
 * Interrupteurs produit temporaires (MVP) — basculer ici pour activer/désactiver une feature.
 * Une désactivation masque ses entrées UI et neutralise ses routes (écran « Bientôt
 * disponible », cf. `ComingSoonPage`).
 */
export const FEATURE_FLAGS: FeatureFlags = {
  topicAuthoring: false,
}
