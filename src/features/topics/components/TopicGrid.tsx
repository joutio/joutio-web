import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicGridStore } from "@/features/shell"
import { topicGridClass } from "../domain/topic-grid"
import { TopicTile } from "./TopicTile"

/**
 * Grille des sujets en **tuiles springboard** (style iOS), à toutes les tailles : 3 ou 4
 * colonnes en compact (réglage « Grille des sujets »), 5 en tablette, 7 en desktop.
 */
export function TopicGrid({
  topics,
  onOpen,
  showStatus = false,
}: {
  topics: TopicCard[]
  onOpen: (topicId: string) => void
  /** Vue « Mes sujets » : badge de statut sur les sujets non publiés. */
  showStatus?: boolean
}) {
  const columns = useTopicGridStore((state) => state.columns)

  return (
    <div className={topicGridClass(columns)}>
      {topics.map((topic) => (
        <TopicTile
          key={topic.topicId}
          topic={topic}
          onOpen={onOpen}
          showStatus={showStatus}
        />
      ))}
    </div>
  )
}
