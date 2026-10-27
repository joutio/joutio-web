import type { TopicCard } from "@/features/topics/domain/topic"

/** Données de l'accueil (`HomeView`). */
export interface Home {
  followedTopics: TopicCard[]
  trendingTopics: TopicCard[]
  /** Sujets récemment publiés ou mis à jour (nouvelles questions). */
  newTopics: TopicCard[]
  /** Sélection personnalisée « Pour toi » issue des centres d'intérêt persistés. */
  recommendedTopics?: TopicCard[]
}
