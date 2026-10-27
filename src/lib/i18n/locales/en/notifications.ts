import type { notifications as frNotifications } from "../fr/notifications"

export const notifications: typeof frNotifications = {
  bell: {
    aria: "Notifications",
    markAll: "Mark all read",
    empty: "No notifications yet.",
    viewAll: "View all notifications",
  },
  list: {
    aria: "Notifications",
  },
  row: {
    follow: "{{name}} followed you.",
    challengeReceived: "{{name}} challenges you!",
    rematchReceived: "{{name}} wants a rematch!",
    challengeDeclined: "{{name}} declined your challenge.",
    roomAccepted: "{{name}} accepted your challenge.",
    wizz: "{{name}} is asking you to join the room.",
    questionReported: "{{name}} reported a question from one of your topics.",
    topicDrafted:
      "Your topic is back to draft: it no longer has enough approved questions.",
    accountSuspended: "Your account has been suspended.",
    fallback: "Notification",
    playerFallback: "A player",
    viewProfile: "View {{name}}'s profile",
    unread: "Unread",
  },
  actions: {
    markRead: "Mark as read",
    markUnread: "Mark as unread",
    delete: "Delete",
  },
  time: {
    justNow: "just now",
    minutes: "{{count}} min ago",
    hours: "{{count}} h ago",
    days: "{{count}} d ago",
  },
  toast: {
    followTitle: "New follower",
    followDescription: "A player followed you.",
    challengeTitle: "New challenge",
    challengeDescription: "Tap to view the invitation and respond.",
    declinedTitle: "Challenge declined",
    declinedDescription: "Your opponent declined your challenge.",
    acceptedTitle: "Your challenge was accepted",
    acceptedDescription: "Tap to join the room.",
    wizzTitle: "Someone is waiting for you!",
    wizzDescription: "Your opponent is in the room — tap to join them.",
    questionReportTitle: "Question report",
    questionReportDescription:
      "A player reported a question from one of your topics — tap to open the topic.",
    topicDraftedTitle: "Topic moved back to draft",
    topicDraftedDescription:
      "Your topic no longer has enough approved questions — tap to open it.",
  },
  presence: {
    hint: "Open their profile to challenge them",
    playerFallback: "A player",
    online: "{{name}} is online",
  },
  push: {
    label: "Push notifications",
    unsupportedIos:
      "On iPhone/iPad: first install Joutio on your Home Screen (iOS 16.4+) to enable notifications.",
    unsupported: "Your browser does not support push notifications.",
    denied:
      "Permission denied — allow notifications for this site in your browser.",
    subscribed:
      "Your challenges and follows arrive even when Joutio is closed.",
    unsubscribed: "Get your challenges and follows even when Joutio is closed.",
    enableError: "Could not enable push notifications.",
    disableError: "Could not disable push notifications.",
  },
  page: {
    filterAll: "All",
    filterUnread: "Unread",
    markAll: "Mark all read",
    deleteAll: "Delete all",
    loadError: "Could not load notifications.",
    emptyUnreadTitle: "No unread notifications",
    emptyTitle: "No notifications",
    emptyDescription:
      "Challenge a player from their profile or a topic: their acceptance and outcomes will land here.",
    previous: "Previous",
    next: "Next",
    pageIndicator: "Page {{page}} / {{totalPages}}",
    deleteAllTitle: "Delete all?",
    deleteAllDescription:
      "All notifications in your inbox will be permanently deleted. This action cannot be undone.",
  },
}
