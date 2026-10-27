import type { topic as frTopic } from "../fr/topic"

export const topic: typeof frTopic = {
  detail: {
    loading: "Loading topic…",
    notFound: "Topic not found",
    backToCatalog: "Back to catalog",
    play: "Start a duel",
    edit: "Edit topic",
    follow: "Follow",
    following: "Following",
    share: "Share",
    progress: "Completed questions",
    stats: {
      mastery: "Mastery",
      followers: "Followers",
      questions: "Questions",
    },
    mastery: "Mastery {{tier}}",
    masteryLocked: "Mastery locked",
    titles: {
      playFirst: "Play your first game against a human to unlock it",
      unlockedByGame: "Unlocked by your first game against a human",
      tab: "Titles",
      subtitle:
        "Finish a first game against a human on this topic to unlock the Iron title, then raise your rank with XP.",
      xpRequired: "{{xp}} XP",
      remaining: "{{xp}} XP to go",
      xpProgress: "{{progress}} / {{target}} XP",
      percent: "{{percent}}%",
      maxTier: "Top tier reached",
    },
    tabs: {
      leaderboard: "Leaderboard",
      progression: "Games",
    },
    emptyTitle: "No duel on this topic yet",
    emptyDescription:
      "Give it a go: seven rounds are enough to make the leaderboard.",
  },
  leaderboard: {
    title: "Leaderboard",
    periodTitle: "Period",
    period: {
      allTime: "All-time",
      monthly: "Monthly",
    },
    periodCaption: {
      allTime: "all time",
      monthly: "this month",
    },
    monthTitle: "Month",
    monthAria: "Choose a month",
    scopeTitle: "Scope",
    scope: {
      world: "World",
      following: "Following",
      country: "Country",
    },
    filtersTitle: "Leaderboard filters",
    view: "View leaderboard",
    elo: "Elo {{rating}}",
    playerFallback: "Player",
    loading: "Loading…",
    error: "Leaderboard unavailable.",
    empty: "No ranked player yet.",
  },
  matchList: {
    outcomes: {
      win: "Win",
      loss: "Loss",
      draw: "Draw",
      waiting: "Waiting",
      inProgress: "In progress",
      cancelled: "Cancelled",
    },
    bot: "Bot",
    opponent: "Opponent",
    against: "against {{name}}",
    openAria: "View the duel result against {{name}}",
    openAriaTopic: "View the duel result — {{topic}}",
  },
  share: {
    title: "Share this topic",
    sub: "Send the link: your guest creates an account if needed and lands right on the topic.",
    message: "Discover the topic “{{name}}” on Joutio!",
  },
}
