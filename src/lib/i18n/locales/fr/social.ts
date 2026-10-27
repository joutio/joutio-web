/** Textes de l'espace Social : annuaire des abonnements et abonnés. */
export const social = {
  people: {
    filterTitle: "Afficher",
    following: "Abonnements ({{count}})",
    followers: "Abonnés ({{count}})",
    summaryBoth: "Abonnements + Abonnés",
  },
  searchPlaceholder: "Chercher une personne…",
  sortSection: "Trier par",
  sortAria: "Trier les personnes",
  countLabel: "personne",
  sorts: {
    elo: "Elo",
    recent: "Ajout récent",
    alpha: "Ordre alphabétique",
  },
  retry: "Réessayer",
  error: "Impossible de charger les personnes",
  emptyFollowing: "Tu ne suis encore personne",
  emptyFollowers: "Personne ne te suit encore",
  emptyBoth: "Aucune personne dans tes abonnements ou tes abonnés",
  emptyDescription:
    "Trouve des joueurs via la recherche, puis ouvre leur profil pour les suivre.",
  exploreTopics: "Explorer les sujets",
  card: {
    fallbackName: "Joueur",
  },
  presence: {
    online: "En ligne",
    recently: "Vu récemment",
    offline: "Hors ligne",
  },
  /** Page Défis & Salons : invitations reçues, défis envoyés et salons ouverts. */
  challenges: {
    receivedGroup: "Défis reçus ({{count}})",
    sentGroup: "Défis envoyés ({{count}})",
    emptyReceived: "Aucun défi reçu",
    emptyReceivedDescription:
      "Un défi lancé depuis une fiche joueur ou un sujet apparaîtra ici.",
    emptySent: "Aucun défi envoyé",
    emptySentDescription:
      "Défie un joueur depuis sa fiche ou depuis la popup « Lancer un duel » d'un sujet.",
  },
  /** Popup d'une demande de revanche reçue (TTL court, hors page Défis). */
  rematchRequest: {
    title: "Demande de revanche",
    description: "{{name}} veut rejouer votre dernier duel.",
    countdown: "Réponse dans {{seconds}} s",
    hint: "Accepte pour ouvrir une nouvelle salle.",
    accept: "Accepter",
    accepting: "Ouverture…",
    decline: "Refuser",
    acceptFailed: "Impossible d'accepter la revanche",
  },
  /** Salons ouverts : groupe de la page Défis & Salons. */
  rooms: {
    group: "Salons ({{count}})",
    empty: "Aucun salon en attente",
    emptyDescription:
      "Crée une salle depuis un sujet pour défier un joueur ou partager un lien d'invitation.",
    create: "Explorer les sujets",
  },
  /** Cartes défis/salons empilées. */
  pending: {
    playerFallback: "Joueur",
    received: "Défi reçu",
    sent: "Défi envoyé",
    room: "Salon ouvert",
    roomWaiting: "En attente d'un joueur",
    fromPlayer: "de {{name}}",
    toPlayer: "à {{name}}",
    withPlayer: "avec {{name}}",
    rematch: "Revanche",
    viewProfile: "Voir le profil de {{name}}",
    viewTopic: "Voir le sujet {{name}}",
    expiresIn: "Expire dans",
    challengeExpiresIn: "Défi expire dans",
    expired: "Expiré",
    decline: "Refuser",
    accept: "Accepter",
    openRoom: "Ouvrir la salle",
    closeRoom: "Fermer le salon",
    cancel: "Annuler",
    goneTitle: "Ce défi n'est plus disponible",
    goneDescription: "Il a été annulé ou déjà résolu.",
    searchPlaceholder: "Rechercher un sujet ou un joueur…",
    countLabel: "élément",
    filterType: "Type",
    filterSort: "Tri",
    sortAria: "Trier les défis et les salons",
    typeAll: "Tous",
    typeReceived: "Reçus",
    typeSent: "Envoyés",
    typeRoom: "Salons",
    sortExpiring: "Expire bientôt",
    sortLatest: "Expire le plus tard",
    emptyAllTitle: "Aucun défi ni salon en attente",
    emptyAllDescription:
      "Crée un défi ou un salon depuis un sujet pour commencer.",
    filteredEmptyTitle: "Aucun résultat",
    filteredEmptyDescription:
      "Aucun défi ni salon ne correspond à ces filtres.",
  },
}
