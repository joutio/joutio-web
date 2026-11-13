/**
 * URLs de `design/specs/platforms/web.md` § 2. Le BFF n'expose pas encore de slug de sujet : la fiche sujet
 * s'adresse par son identifiant (`/topics/{topicId}`) jusqu'à ce qu'il en expose un.
 */
/** Catégories des Réglages, une page chacune. */
export type SettingsPage = 'account' | 'privacy' | 'notifications' | 'game' | 'display' | 'invite' | 'help'

export const ROUTES = {
  home: '/',
  topics: '/topics',
  topic: (topicId: string) => `/topics/${encodeURIComponent(topicId)}`,
  topicLeaderboard: (topicId: string) => `/topics/${encodeURIComponent(topicId)}/leaderboard`,
  myGames: (topicId?: string) => (topicId ? `/me/games?topicId=${encodeURIComponent(topicId)}` : '/me/games'),
  /** Toutes les parties contre un joueur (`historique.md` § 2). */
  gamesAgainst: (opponentId: string) => `/me/games?opponentId=${encodeURIComponent(opponentId)}`,
  me: '/me',
  myTitles: '/me/titles',
  settings: '/me/settings',
  /** Page d'une catégorie des Réglages (`reglages.md` § 1). */
  settingsPage: (page: SettingsPage) => `/me/settings/${page}`,
  /** Éditer le profil (`editer-profil.md`). */
  editProfile: '/me/edit',
  /** Éditeur d'avatar et suppression du compte : poussés depuis les Réglages (`web.md` § 2 : « Réglages (avatar, suppression) »). */
  avatar: '/me/settings/avatar',
  deleteAccount: '/me/settings/delete',
  /** Création : Mes sujets = onglet Création de l'Accueil (2026-11-13) ; l'atelier reste sous `/me/topics/{id}`. */
  myTopics: '/?tab=creation',
  myTopic: (topicId: string) => `/me/topics/${encodeURIComponent(topicId)}`,
  topicQuestions: (topicId: string) => `/me/topics/${encodeURIComponent(topicId)}/questions`,
  /** Éditeur de question ; `resolve` : enregistrer clôt les signalements ouverts (ouvert depuis les Signalements). */
  questionEditor: (topicId: string, questionId?: string, resolve = false) =>
    `/me/topics/${encodeURIComponent(topicId)}/questions/${questionId ? encodeURIComponent(questionId) : 'new'}${resolve ? '?resolve=1' : ''}`,
  topicTeam: (topicId: string) => `/me/topics/${encodeURIComponent(topicId)}/team`,
  topicModeration: (topicId: string, tab?: 'reports') => `/me/topics/${encodeURIComponent(topicId)}/moderation${tab ? `?tab=${tab}` : ''}`,
  /** Signalements d'une question, en file ; `highlight` : signalement de la notification. */
  questionReports: (topicId: string, questionId: string, highlight?: string) =>
    `/me/topics/${encodeURIComponent(topicId)}/reports/${encodeURIComponent(questionId)}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`,
  /** Série et Sujets joués : écrans poussés du Profil, absents de `web.md` § 2. */
  myStreak: '/me/streak',
  myPlayedTopics: '/me/played',
  /** Le BFF n'expose pas de slug de joueur : la fiche s'adresse par son identifiant. */
  player: (userId: string) => `/players/${encodeURIComponent(userId)}`,
  result: (gameId: string) => `/games/${encodeURIComponent(gameId)}/result`,
  game: (gameId: string) => `/games/${encodeURIComponent(gameId)}`,
  /** Salon de préparation : absent de `web.md` § 2, aligné sur l'API (`/api/rooms/{id}`). */
  room: (roomId: string) => `/rooms/${encodeURIComponent(roomId)}`,
  /** Matchmaking (`web.md` § 2 : `/play`), le ticket en paramètre. */
  play: (ticketId: string) => `/play?ticket=${encodeURIComponent(ticketId)}`,
  join: (roomId: string) => `/join/${encodeURIComponent(roomId)}`,
  social: '/social',
  challenges: '/challenges',
  premium: '/premium',
  notifications: '/notifications',
  search: '/search',
} as const
