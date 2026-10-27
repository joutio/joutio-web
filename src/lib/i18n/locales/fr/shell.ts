/** Textes de la coquille : navigation, topbar, profil, réglages, bandeaux. */
export const shell = {
  nav: {
    home: "Accueil",
    topics: "Sujets",
    social: "Social",
    challenges: "Défis",
    notifications: "Notifications",
    profile: "Profil",
  },
  brand: {
    tagline: "Duels de culture",
  },
  topbar: {
    searchPlaceholder: "Chercher un sujet ou un utilisateur…",
    searchAria: "Rechercher un sujet ou un utilisateur",
    searchShortAria: "Rechercher",
    bestStreak: "Meilleure série de victoires",
    theme: {
      toLight: "Passer en thème clair",
      toDark: "Passer en thème sombre",
    },
    subtitles: {
      home: "Reprends un duel ou pars en chercher un nouveau.",
      topics: "Cherche, filtre, trie : le catalogue entier est ici.",
      social: "Tes abonnements et tes abonnés.",
      challenges: "Tes défis reçus et envoyés, et tes salons en attente.",
      notifications: "Invitations, défis et abonnements.",
      profile: "Ta progression et tous tes duels.",
      player: "Profil public, en lecture seule.",
      settings: "Compte, profil et préférences.",
      avatar: "Compose ton personnage — enregistrement automatique.",
      newTopic:
        "Crée un sujet, ajoute tes questions, puis publie-le au catalogue.",
      manage: "Édite le sujet, ajoute des questions et modère-les.",
      privateRoom:
        "Salle d'attente — la partie démarre quand les deux joueurs sont là.",
    },
    crumbs: {
      newTopic: "Nouveau sujet",
      manage: "Gestion",
      topicFallback: "Sujet",
      playerFallback: "Joueur",
      settings: "Réglages",
      avatar: "Avatar",
      privateRoom: "Salon privé",
    },
    playersCount: "{{count}} joueurs",
  },
  profileMenu: {
    aria: "Menu du profil",
    profile: "Profil",
    appearance: "Apparence",
    settings: "Réglages",
    logout: "Se déconnecter",
    theme: {
      light: "Clair",
      dark: "Sombre",
      system: "Système",
    },
  },
  profile: {
    tabs: {
      parties: "Parties",
      stats: "Statistiques",
      badges: "Badges",
      titles: "Titres",
      rewards: "Récompenses",
    },

    loading: "Chargement du profil…",
    stats: {
      games: "Parties",
      followers: "Abonnés",
      following: "Abonné à",
    },
    edit: "Modifier le profil",
    share: "Partager",
    topicsTitle: "Sujets joués",
    topicsAria: "Répartition de tes duels par sujet",
    topicsOther: "Autres",
    streakTitle: "Série de présence",
    streakCardTitle: "Ta semaine",
    streakDescription:
      "Un jour avec au moins un duel humain prolonge ta série. Un jour manqué la remet à zéro.",
    streakCurrent: "Série actuelle",
    streakRecord: "Record",
    streakActiveDays: "Jours actifs",
    streakAria: "Calendrier de ta série de présence sur la semaine en cours",
    historyTitle: "Historique des duels",
    emptyTitle: "Aucun duel pour l'instant",
    emptyDescription:
      "Sept tours, dix secondes par question. Le premier duel prend moins de deux minutes.",
    findOpponent: "Trouver un adversaire",
  },
  settings: {
    sections: {
      title: "Titre affiché",
      profile: "Profil",
      account: "Compte",
      notifications: "Notifications",
      sounds: "Sons",
      gameplay: "Jeu",
      appearance: "Apparence & langue",
      session: "Session",
      danger: "Zone de danger",
    },
    avatar: {
      label: "Photo de profil",
      description: "Elo {{rating}} — modifiable à tout moment.",
      changeAria: "Changer l'avatar",
      edit: "Modifier",
    },
    banner: {
      label: "Bannière de profil",
      description:
        "Visuel panoramique affiché derrière ton avatar sur ton profil et ta fiche joueur.",
    },
    interests: {
      title: "Centres d'intérêt",
      sub: "Choisis 1 à 3 univers. Ils alimentent la sélection « Pour toi » de ton accueil.",
      save: "Enregistrer",
      saving: "Enregistrement…",
      saved: "Centres d'intérêt enregistrés.",
      saveError: "Impossible d'enregistrer tes centres d'intérêt.",
    },
    pseudonym: {
      label: "Pseudonyme",
      description: "Le nom affiché dans les duels et les classements.",
      required: "Pseudonyme requis",
      max: "40 caractères max",
    },
    bio: {
      label: "Bio",
      description:
        "Présente-toi en quelques mots (160 caractères max). Visible sur ton profil public.",
      max: "160 caractères max",
    },
    country: {
      label: "Pays",
      description: "Utilisé pour les classements par pays.",
      aria: "Pays",
    },
    email: {
      label: "Adresse e-mail",
      description: "Ton identifiant de connexion — non modifiable.",
    },
    notificationPreferences: {
      sub: "Choisis ce que tu veux recevoir (préférences enregistrées).",
      follows: {
        label: "Nouveaux abonnés",
        description: "Quand un joueur s'abonne à toi.",
      },
      challenges: {
        label: "Défis reçus",
        description: "Invitations et issues de tes défis.",
      },
      questionReports: {
        label: "Signalements de questions",
        description: "Quand un joueur signale une question d'un de tes sujets.",
      },
    },
    sounds: {
      label: "Sons de l'app",
      description:
        "Notifications, réponses en duel, accumulation de points et enregistrements — un court son à chaque fois.",
    },
    matchmaking: {
      autoTrain: {
        label: "Lancer un entraînement si aucun adversaire",
        description:
          "Après 10 s sans joueur humain, démarre un entraînement contre un robot (sans XP ni série). Désactive pour réessayer manuellement.",
      },
    },
    theme: {
      label: "Thème",
      description: "Apparence de l'interface.",
      aria: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
    },
    bottomNav: {
      label: "Barre de navigation",
      description: "Flottante (pilule) ou fixe en bas de l'écran.",
      aria: "Barre de navigation",
      floating: "Flottante",
      fixed: "Fixe",
    },
    topicGrid: {
      label: "Grille des sujets",
      description: "Nombre de colonnes de la grille des sujets sur mobile.",
      aria: "Colonnes de la grille des sujets",
      columns3: "3 colonnes",
      columns4: "4 colonnes",
    },
    language: {
      label: "Langue",
      description: "Langue des questions et de l'interface.",
      aria: "Langue",
    },
    session: {
      label: "Déconnexion",
      description: "Tu peux te déconnecter à tout moment.",
      logout: "Se déconnecter",
    },
    danger: {
      label: "Supprimer mon compte",
      description:
        "Suppression immédiate et définitive du compte, de tes sujets, de tes questions et de tes données personnelles.",
      deleteAction: "Supprimer mon compte",
      dialog: {
        title: "Supprimer définitivement ton compte ?",
        subtitle: "Cette action est immédiate et irréversible.",
        warning:
          "Cette action supprime immédiatement ton compte, ton profil, tes sujets, tes questions et tes données associées. Les parties passées restent visibles sous « Joueur supprimé ».",
        codeHint: "Nous enverrons un code de confirmation à {{email}}.",
        sendCode: "Recevoir le code",
        delete: "Supprimer définitivement",
        cancel: "Annuler",
        error: "La suppression a échoué. Vérifie le code et réessaie.",
      },
    },
    saveSuccess: "Modifications enregistrées",
    saveError: "Échec de l'enregistrement — réessaie.",
    backToProfile: "Retour au profil",
    fallbackPlayer: "Joueur",
  },
  install: {
    sectionTitle: "Application",
    sectionSub:
      "Installe Joutio pour un affichage plein écran et les notifications push.",
    bannerTitle: "Installe Joutio",
    bannerNative: "Plein écran et notifications, comme une vraie app.",
    bannerIos:
      "Partage → « Sur l'écran d'accueil » pour activer les notifications.",
    install: "Installer",
    dismissBanner: "Masquer le bandeau d'installation",
    rowLabel: "Installer Joutio",
    rowNative: "Ouvre Joutio comme une app, en plein écran.",
    rowIos: "Sur iPhone/iPad : bouton Partager puis « Sur l'écran d'accueil ».",
    homeScreen: "Écran d'accueil",
  },
  update: {
    title: "Nouvelle version disponible",
    description: "Recharge l'application pour en profiter.",
    reload: "Recharger",
    dismiss: "Masquer le bandeau de mise à jour",
  },
  error: {
    title: "Une erreur est survenue",
    fallback: "Erreur inattendue.",
    reload: "Recharger",
  },
  comingSoon: {
    title: "Bientôt disponible",
    description:
      "La création et la gestion des thèmes arrivent après la sortie du MVP — reviens bientôt !",
    back: "Retour",
  },
  search: {
    title: "Recherche globale",
    description: "Chercher un sujet ou un utilisateur",
    heading: "Recherche",
    closeAria: "Fermer la recherche",
    placeholder: "Chercher un sujet ou un utilisateur…",
    emptyQuery: "Commencez à taper pour rechercher un sujet ou un utilisateur…",
    emptyNoResult: "Aucun sujet ni utilisateur ne correspond.",
    topicsGroup: "Sujets",
    playersGroup: "Utilisateurs",
    topicFallback: "Sujet",
    playerFallback: "Joueur",
    userFallback: "Utilisateur",
  },
  toBuild: {
    label: "À construire",
  },
}
