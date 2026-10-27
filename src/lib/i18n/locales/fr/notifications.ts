/** Textes de l'inbox, de la cloche, des toasts temps réel et du réglage push. */
export const notifications = {
  bell: {
    aria: "Notifications",
    markAll: "Tout lire",
    empty: "Aucune notification pour l'instant.",
    viewAll: "Voir toutes les notifications",
  },
  list: {
    aria: "Notifications",
  },
  row: {
    follow: "{{name}} s'est abonné à toi.",
    challengeReceived: "{{name}} te défie !",
    rematchReceived: "{{name}} te demande une revanche !",
    challengeDeclined: "{{name}} a refusé ton défi.",
    roomAccepted: "{{name}} a accepté ton défi.",
    wizz: "{{name}} te demande de rejoindre la salle.",
    questionReported: "{{name}} a signalé une question d'un de tes sujets.",
    topicDrafted:
      "Ton sujet est repassé en brouillon : il ne reste plus assez de questions approuvées.",
    accountSuspended: "Ton compte a été suspendu.",
    fallback: "Notification",
    playerFallback: "Un joueur",
    viewProfile: "Voir le profil de {{name}}",
    unread: "Non lue",
  },
  actions: {
    markRead: "Marquer comme lue",
    markUnread: "Marquer comme non lue",
    delete: "Supprimer",
  },
  time: {
    justNow: "à l'instant",
    minutes: "il y a {{count}} min",
    hours: "il y a {{count}} h",
    days: "il y a {{count}} j",
  },
  toast: {
    followTitle: "Nouvel abonné",
    followDescription: "Un joueur s'est abonné à toi.",
    challengeTitle: "Nouveau défi",
    challengeDescription: "Touche pour voir l'invitation et répondre.",
    declinedTitle: "Défi refusé",
    declinedDescription: "Ton adversaire a refusé ton défi.",
    acceptedTitle: "Ton défi a été accepté",
    acceptedDescription: "Touche pour rejoindre la salle.",
    wizzTitle: "On te demande dans la salle !",
    wizzDescription: "Ton adversaire t'y attend — touche pour le rejoindre.",
    questionReportTitle: "Signalement de question",
    questionReportDescription:
      "Un joueur a signalé une question d'un de tes sujets — touche pour ouvrir le sujet.",
    topicDraftedTitle: "Sujet repassé en brouillon",
    topicDraftedDescription:
      "Ton sujet n'a plus assez de questions approuvées — touche pour l'ouvrir.",
  },
  presence: {
    hint: "Ouvre son profil pour le défier",
    playerFallback: "Un joueur",
    online: "{{name}} est en ligne",
  },
  push: {
    label: "Notifications push",
    unsupportedIos:
      "Sur iPhone/iPad : installe d'abord Joutio sur l'écran d'accueil (iOS 16.4+) pour activer les notifications.",
    unsupported:
      "Ton navigateur ne prend pas en charge les notifications push.",
    denied:
      "Autorisation refusée — autorise les notifications pour ce site dans ton navigateur.",
    subscribed:
      "Tes défis et abonnements arrivent même quand Joutio est fermé.",
    unsubscribed:
      "Reçois tes défis et abonnements même quand Joutio est fermé.",
    enableError: "Activation des notifications push impossible.",
    disableError: "Désactivation des notifications push impossible.",
  },
  page: {
    filterAll: "Toutes",
    filterUnread: "Non lues",
    markAll: "Tout marquer lu",
    deleteAll: "Tout supprimer",
    loadError: "Impossible de charger les notifications.",
    emptyUnreadTitle: "Aucune notification non lue",
    emptyTitle: "Aucune notification",
    emptyDescription:
      "Défie un joueur depuis sa fiche ou un sujet : son acceptation et les issues arriveront ici.",
    previous: "Précédent",
    next: "Suivant",
    pageIndicator: "Page {{page}} / {{totalPages}}",
    deleteAllTitle: "Tout supprimer ?",
    deleteAllDescription:
      "Toutes les notifications de ta boîte seront définitivement supprimées. Cette action est irréversible.",
  },
}
