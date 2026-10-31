import { TopicIcon } from "@/shared/components/topic-icon"
import { TOKEN } from "@/shared/theme/tokens"

interface WaitingTopicProps {
  topic: {
    name: string
    emoji?: string
    color?: string
    imageUrl?: string
    category?: string | null
    categoryLabel?: string | null
  }
  size?: number
}

/**
 * Sujet en cours (file de matchmaking / salle d'attente) : pastille avec halo coloré,
 * nom en display et catégorie en surtitre.
 */
export function WaitingTopic({ topic, size = 64 }: WaitingTopicProps) {
  const color = topic.color ?? TOKEN.primary

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <TopicIcon
          topic={{
            emoji: topic.emoji ?? "❔",
            color: topic.color ?? null,
            imageUrl: topic.imageUrl,
            category: topic.category ?? null,
          }}
          size={size}
          className="relative ring-1 ring-white/10"
        />
      </div>
      <div className="text-center">
        <div className="font-heading text-lg font-bold tracking-tight">
          {topic.name}
        </div>
        {topic.categoryLabel && (
          <div
            className="mt-1 text-2xs font-semibold tracking-[0.18em] uppercase"
            style={{ color }}
          >
            {topic.categoryLabel}
          </div>
        )}
      </div>
    </div>
  )
}
