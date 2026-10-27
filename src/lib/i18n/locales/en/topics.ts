import type { topics as frTopics } from "../fr/topics"

export const topics: typeof frTopics = {
  list: {
    create: "Create a topic",
    searchPlaceholder: "Search all topics…",
    followedToggle: "Followed",
    mineToggle: "My topics",
    countLabel: "topic",
    sortAria: "Sort topics",
    retry: "Try again",
    resetFilters: "Reset filters",
    loadMore: "Show more topics",
    errorMine: "Could not load your topics",
    error: "Could not load topics",
    emptyTitle: "No topic matches",
    emptyMine:
      "Create your first topic, add at least 7 approved questions, then publish it.",
    empty: "Try a shorter keyword, or remove a category.",
  },
  filters: {
    title: "Filters",
    sourceFollowed: "Only followed",
    sourceAll: "All topics",
    category: "Category",
    all: "All",
    by: "Filter by {{label}}",
    sort: "Sort by",
    noResult: "No results.",
  },
  sorts: {
    popular: "Most followed",
    mostPlayed: "Most played",
    alpha: "Alphabetical order",
    recent: "Newest",
  },
  status: {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  },
  carousel: {
    region: "Topics",
    rank: "No. {{rank}}",
  },
}
