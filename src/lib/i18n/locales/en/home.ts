import type { home as frHome } from "../fr/home"

export const home: typeof frHome = {
  seeAll: "See all",
  sectionHeader: {
    seeAll: "See all",
  },
  followedTopics: {
    title: "Topics you follow",
  },
  newTopics: {
    title: "New topics",
    empty: "No topic published yet.",
  },
  trending: {
    title: "Top 10 right now",
    browse: "Browse the catalog",
    browseCompact: "Catalog",
    error: "Could not load home.",
    retry: "Try again",
  },
  resumeBanner: {
    title: "Game in progress",
    opponent: "against {{name}}",
    bot: "against the bot",
    join: "Join",
  },
  forYou: {
    title: "For you",
  },
  onboarding: {
    welcome: "Welcome",
    stepLabel: "Step {{current}} of {{total}}",
    stepperLabel: "Onboarding progress",
    interestsTitle: "Which worlds appeal to you?",
    interestsSubtitle:
      "Choose 1 to 3 worlds. They personalize your home and help us suggest your first topic.",
    selectedUniverses: "{{count}} / 3 worlds",
    minimumUniverse: "Choose at least {{count}} world.",
    chooseUpTo: "Up to {{count}} worlds.",
    maximumUniverses: "{{count}} worlds maximum.",
    primaryTitle: "Your main world",
    primarySubtitle: "We will use it first to suggest your first topic.",
    seeTheme: "See my topic",
    skip: "Skip",
    continue: "Continue",
    explore: "Explore home",
    joinRoom: "Join the room",
    firstDuelEyebrow: "Your first duel",
    firstDuelTitle: "Your first topic",
    firstDuelSubtitle:
      "Based on your choices, here is the topic we suggest to get started.",
    recommendationsError: "Could not prepare your topics. Please try again.",
    loadingRecommendations: "Preparing your topic…",
    noRecommendationsTitle: "No playable topic right now",
    noRecommendations:
      "We could not find a topic with enough questions in your worlds. You can explore home and come back later.",
    recommendedForYou: "Recommended for you",
    whyPrimary: "You chose {{category}} as your main world.",
    whyInterest: "This topic is one of your worlds.",
    alternativesTitle: "Or you can try…",
    botTitle: "Training duel",
    botDescription:
      "Against a bot, with no Elo or XP. Just to discover how a game works.",
    start: "Discover the duel",
    starting: "Preparing…",
    startError: "Could not start the game. Please try again.",
    loadError: "Could not load your profile. Please try again.",
    retry: "Try again",
    saveError: "Could not save your onboarding. Please try again.",
    categoriesError: "Could not load worlds.",
    noCategories: "No world available right now.",
    noTopics: "No topic available right now.",
    previewForYou: "For you",
    previewHomeTitle: "A home made for you",
    previewHomeFilled: "Your worlds already fill your personalized selection.",
    previewHomeEmpty:
      "Choose your worlds: your personalized selection will appear here.",
    previewNote:
      "Your choice feeds the “For you” home rail and the topic of your first duel.",
    previewDuel: "Your first duel",
    previewBot: "A bot",
    previewTraining: "Training",
    previewNoElo: "No Elo",
    previewDuelNote:
      "7 questions, no pressure. You will discover the duel rhythm before facing a player.",
  },
}
