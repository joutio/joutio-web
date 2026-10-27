import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { EntityTile } from "@/shared/components/entity-tile"
import { TopicIcon } from "@/shared/components/topic-icon"
import type { TranslationKey } from "@/lib/i18n/types"
import type { TopicCard, TopicStatus } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

const STATUS_KEYS: Record<TopicStatus, TranslationKey> = {
  DRAFT: "topics.status.draft",
  PUBLISHED: "topics.status.published",
  ARCHIVED: "topics.status.archived",
}

/**
 * Tuile de sujet **springboard iOS** — présentation unique, à toutes les tailles : visuel
 * fluide et nom seul, aucune carte. Dans la vue « Mes sujets » (`showStatus`), un badge
 * distingue les sujets non publiés sous le nom.
 */
export function TopicTile({
  topic,
  onOpen,
  showStatus = false,
}: {
  topic: TopicCard
  onOpen: (topicId: string) => void
  showStatus?: boolean
}) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const statusBadge =
    showStatus && topic.status !== "PUBLISHED" ? (
      <Badge variant="outline" className="shrink-0 text-2xs">
        {t(STATUS_KEYS[topic.status])}
      </Badge>
    ) : undefined

  return (
    <EntityTile
      dataSlot="topic-card"
      visual={<TopicIcon topic={topic} fluid className="shadow-md" />}
      title={resolveName(topic.names)}
      trailing={statusBadge}
      onClick={() => onOpen(topic.topicId)}
    />
  )
}
