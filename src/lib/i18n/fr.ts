/** Textes français : ceux du lab, mot pour mot. Les clés s'ajoutent écran par écran. */
export const fr = {
  'nav.home': 'Accueil',
  'nav.topics': 'Sujets',
  'nav.social': 'Social',
  'nav.challenges': 'Défis',
  'nav.profile': 'Profil',
  'frame.tagline': 'Le quiz en duel, sur tous les sujets.',
  'callback.loading': 'Connexion…',
  'callback.error': 'La connexion a échoué.',
  'callback.retry': 'Réessayer',
  'common.comingSoon': 'Bientôt ici.',
}

export type Messages = Record<keyof typeof fr, string>
