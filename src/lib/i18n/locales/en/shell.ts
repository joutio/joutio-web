import type { shell as frShell } from "../fr/shell"

export const shell: typeof frShell = {
  nav: {
    home: "Home",
    topics: "Topics",
    social: "Social",
    challenges: "Challenges",
    notifications: "Notifications",
    profile: "Profile",
  },
  brand: {
    tagline: "Trivia duels",
  },
  topbar: {
    searchPlaceholder: "Search a topic or a user…",
    searchAria: "Search a topic or a user",
    searchShortAria: "Search",
    bestStreak: "Best win streak",
    theme: {
      toLight: "Switch to light theme",
      toDark: "Switch to dark theme",
    },
    subtitles: {
      home: "Resume a duel or find a new one.",
      topics: "Search, filter, sort: the whole catalog is here.",
      social: "Your follows and followers.",
      challenges: "Your received and sent challenges, and pending rooms.",
      notifications: "Invitations, challenges and follows.",
      profile: "Your progress and all your duels.",
      player: "Public profile, read-only.",
      settings: "Account, profile and preferences.",
      avatar: "Build your character — saved automatically.",
      newTopic: "Create a topic, add your questions, then publish it.",
      manage: "Edit the topic, add questions and moderate them.",
      privateRoom: "Waiting room — the game starts when both players are here.",
    },
    crumbs: {
      newTopic: "New topic",
      manage: "Manage",
      topicFallback: "Topic",
      playerFallback: "Player",
      settings: "Settings",
      avatar: "Avatar",
      privateRoom: "Private room",
    },
    playersCount: "{{count}} players",
  },
  profileMenu: {
    aria: "Profile menu",
    profile: "Profile",
    appearance: "Appearance",
    settings: "Settings",
    logout: "Sign out",
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
  },
  profile: {
    tabs: {
      parties: "Games",
      stats: "Stats",
      badges: "Badges",
      titles: "Titles",
      rewards: "Rewards",
    },

    loading: "Loading profile…",
    stats: {
      games: "Games",
      followers: "Followers",
      following: "Following",
    },
    edit: "Edit profile",
    share: "Share",
    topicsTitle: "Topics played",
    topicsAria: "Your duels by topic",
    topicsOther: "Others",
    streakTitle: "Play streak",
    streakCardTitle: "Your week",
    streakDescription:
      "A day with at least one human duel extends your streak. A missed day resets it.",
    streakCurrent: "Current streak",
    streakRecord: "Best streak",
    streakActiveDays: "Active days",
    streakAria: "Your play streak calendar for the current week",
    historyTitle: "Duel history",
    emptyTitle: "No duels yet",
    emptyDescription:
      "Seven rounds, ten seconds per question. The first duel takes less than two minutes.",
    findOpponent: "Find an opponent",
  },
  settings: {
    sections: {
      title: "Displayed title",
      profile: "Profile",
      account: "Account",
      notifications: "Notifications",
      sounds: "Sounds",
      gameplay: "Gameplay",
      appearance: "Appearance & language",
      session: "Session",
      danger: "Danger zone",
    },
    avatar: {
      label: "Profile picture",
      description: "Elo {{rating}} — editable at any time.",
      changeAria: "Change avatar",
      edit: "Edit",
    },
    banner: {
      label: "Profile banner",
      description:
        "Panoramic visual displayed behind your avatar on your profile and player page.",
    },
    interests: {
      title: "Interests",
      sub: "Choose 1 to 3 worlds. They feed the “For you” selection on your home.",
      save: "Save",
      saving: "Saving…",
      saved: "Interests saved.",
      saveError: "Could not save your interests.",
    },
    pseudonym: {
      label: "Pseudonym",
      description: "The name shown in duels and leaderboards.",
      required: "Pseudonym required",
      max: "40 characters max",
    },
    bio: {
      label: "Bio",
      description:
        "Introduce yourself in a few words (160 characters max). Visible on your public profile.",
      max: "160 characters max",
    },
    country: {
      label: "Country",
      description: "Used for country leaderboards.",
      aria: "Country",
    },
    email: {
      label: "Email address",
      description: "Your login identifier — not editable.",
    },
    notificationPreferences: {
      sub: "Choose what you want to receive (preferences saved).",
      follows: {
        label: "New followers",
        description: "When a player follows you.",
      },
      challenges: {
        label: "Challenges received",
        description: "Invitations and outcomes of your challenges.",
      },
      questionReports: {
        label: "Question reports",
        description:
          "When a player reports a question from one of your topics.",
      },
    },
    sounds: {
      label: "App sounds",
      description:
        "Notifications, duel answers, point build-up and saved changes — a short sound every time.",
    },
    matchmaking: {
      autoTrain: {
        label: "Start training when no opponent is found",
        description:
          "After 10 seconds without a human player, start a training game against a bot (no XP or streak). Turn off to retry manually.",
      },
    },
    theme: {
      label: "Theme",
      description: "Interface appearance.",
      aria: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    bottomNav: {
      label: "Navigation bar",
      description: "Floating (pill) or fixed at the bottom of the screen.",
      aria: "Navigation bar",
      floating: "Floating",
      fixed: "Fixed",
    },
    topicGrid: {
      label: "Topics grid",
      description: "Number of columns in the topics grid on mobile.",
      aria: "Topics grid columns",
      columns3: "3 columns",
      columns4: "4 columns",
    },
    language: {
      label: "Language",
      description: "Language of questions and interface.",
      aria: "Language",
    },
    session: {
      label: "Sign out",
      description: "You can sign out at any time.",
      logout: "Sign out",
    },
    danger: {
      label: "Delete my account",
      description:
        "Immediate, permanent deletion of your account, topics, questions and personal data.",
      deleteAction: "Delete my account",
      dialog: {
        title: "Permanently delete your account?",
        subtitle: "This action is immediate and irreversible.",
        warning:
          "This immediately deletes your account, profile, topics, questions and related data. Past games remain visible as “Deleted player”.",
        codeHint: "We will send a confirmation code to {{email}}.",
        sendCode: "Send the code",
        delete: "Delete permanently",
        cancel: "Cancel",
        error: "Deletion failed. Check the code and try again.",
      },
    },
    saveSuccess: "Changes saved",
    saveError: "Could not save — please try again.",
    backToProfile: "Back to profile",
    fallbackPlayer: "Player",
  },
  install: {
    sectionTitle: "Application",
    sectionSub: "Install Joutio for full screen and push notifications.",
    bannerTitle: "Install Joutio",
    bannerNative: "Full screen and notifications, like a real app.",
    bannerIos: "Share → “Add to Home Screen” to enable notifications.",
    install: "Install",
    dismissBanner: "Hide the install banner",
    rowLabel: "Install Joutio",
    rowNative: "Open Joutio like an app, in full screen.",
    rowIos: "On iPhone/iPad: Share button then “Add to Home Screen”.",
    homeScreen: "Home Screen",
  },
  update: {
    title: "New version available",
    description: "Reload the app to get it.",
    reload: "Reload",
    dismiss: "Hide the update banner",
  },
  error: {
    title: "Something went wrong",
    fallback: "Unexpected error.",
    reload: "Reload",
  },
  comingSoon: {
    title: "Coming soon",
    description:
      "Topic creation and management arrive after the MVP launch — check back soon!",
    back: "Back",
  },
  search: {
    title: "Global search",
    description: "Search a topic or a user",
    heading: "Search",
    closeAria: "Close search",
    placeholder: "Search a topic or a user…",
    emptyQuery: "Start typing to search a topic or a user…",
    emptyNoResult: "No topic or user matches.",
    topicsGroup: "Topics",
    playersGroup: "Users",
    topicFallback: "Topic",
    playerFallback: "Player",
    userFallback: "User",
  },
  toBuild: {
    label: "To build",
  },
}
