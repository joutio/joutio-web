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
        <div
          className="qu-halo absolute -inset-5 rounded-full"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, ${color} 55%, transparent), color-mix(in srgb, ${color} 0%, transparent) 70%)`,
            filter: "blur(6px)",
          }}
        />
        <TopicIcon
          topic={{
            emoji: topic.emoji ?? "❔",
            color: topic.color ?? null,
            imageUrl: topic.imageUrl,
            category: topic.category ?? null,
          }}
          size={size}
          className="relative shadow-2xl ring-1 ring-white/10"
        />
      </div>
      <div className="text-center">
        <div className="font-heading text-lg font-extrabold tracking-tight">
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
