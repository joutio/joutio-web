import { Zap } from "lucide-react"
import { TopicIcon } from "@/shared/components/topic-icon"
import { UserAvatar } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { Identity } from "./Identity"
import { NamePlate } from "./NamePlate"

const WATERMARK_EMOJIS = [
  "🎯",
  "🧠",
  "🌍",
  "⚡",
  "🎲",
  "🏆",
  "🎵",
  "🔬",
  "📚",
  "🎬",
  "⚽",
  "🍔",
  "🎮",
  "🗺️",
  "🐾",
  "💡",
  "🎨",
  "💻",
  "🃏",
  "⭐",
  "🔥",
  "🌙",
  "🍀",
  "🎤",
]

interface VersusPlayer {
  name: string
  rating?: number
  country?: string
  userId?: string
  avatarOptions?: string
}

interface VersusOpponent {
  name: string
  color?: string
  rating?: number
  country?: string
  userId?: string
  avatarOptions?: string
}

interface VersusTopic {
  name: string
  emoji?: string
  color?: string
  imageUrl?: string
}

interface VersusScreenProps {
  player: VersusPlayer
  opponent: VersusOpponent
  topic: VersusTopic
}

/** Écran d'intro « VS » : deux camps opposés de part et d'autre de la ligne de duel. */
export function VersusScreen({ player, opponent, topic }: VersusScreenProps) {
  const topicForIcon = {
    emoji: topic.emoji ?? "❔",
    color: topic.color ?? TOKEN.primary,
    imageUrl: topic.imageUrl ?? undefined,
  }
  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <div
        className="qu-vs-panel-top absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: "50%",
          background:
            "radial-gradient(125% 115% at 50% 100%, #7e1b1b 0%, #41100f 45%, #150606 100%)",
        }}
      >
        <div
          className="qu-burst-spin absolute"
          style={{
            left: "50%",
            top: "50%",
            width: "150%",
            aspectRatio: "1",
            transform: "translate(-50%,-50%)",
            background:
              "conic-gradient(from 0deg, transparent 0deg 7deg, rgba(255,255,255,.06) 7deg 13deg, transparent 13deg 20deg)",
            opacity: 0.8,
          }}
        />
        <NamePlate name={player.name} accent={TOKEN.primary} side="top" />
        <div
          className="absolute inset-0 flex items-center"
          style={{ padding: "0 clamp(20px, 6vw, 90px)" }}
        >
          <Identity
            name={player.name}
            rating={player.rating}
            country={player.country}
            side="top"
            avatar={
              <UserAvatar
                name={player.name}
                userId={player.userId}
                avatarOptions={player.avatarOptions}
                size={80}
              />
            }
          />
        </div>
        <div
          className="qu-scan absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,.26) 0 2px, transparent 2px 6px)",
          }}
        />
      </div>

      <div
        className="qu-vs-panel-bottom absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          height: "50%",
          background: "linear-gradient(180deg, #2c2c31 0%, #191a1e 100%)",
        }}
      >
        <div
          className="absolute inset-0 grid content-around justify-items-center opacity-[0.06]"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            padding: 14,
            fontSize: 26,
          }}
        >
          {WATERMARK_EMOJIS.map((emoji, index) => (
            <span key={index}>{emoji}</span>
          ))}
        </div>
        <NamePlate name={opponent.name} accent="#e0483a" side="bottom" />
        <div
          className="absolute inset-0 flex items-center justify-end"
          style={{ padding: "0 clamp(20px, 6vw, 90px)" }}
        >
          <Identity
            name={opponent.name}
            rating={opponent.rating}
            country={opponent.country}
            side="bottom"
            avatar={
              <UserAvatar
                name={opponent.name}
                userId={opponent.userId}
                avatarOptions={opponent.avatarOptions}
                size={80}
              />
            }
          />
        </div>
        <div
          className="qu-scan absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,.22) 0 2px, transparent 2px 6px)",
            animationDirection: "reverse",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{ left: 0, right: 0, top: "50%", transform: "translateY(-50%)" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -6,
            height: 2,
            background: TOKEN.fg,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 6,
            height: 2,
            background: TOKEN.fg,
            opacity: 0.9,
          }}
        />
      </div>

      <div
        className="absolute"
        style={{ left: 0, right: 0, top: 20, zIndex: 3, textAlign: "center" }}
      >
        <TopicIcon topic={topicForIcon} size={34} className="mx-auto" />
        <div style={{ color: TOKEN.mutedFg, fontSize: 12, marginTop: 6 }}>
          {topic.name}
        </div>
      </div>

      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <div
          className="relative inline-flex items-center justify-center"
          style={{
            width: 132,
            height: 132,
            borderRadius: 999,
            background: TOKEN.duelBg,
            border: `3px solid ${TOKEN.fg}`,
          }}
        >
          {[0, 1].map((index) => (
            <span
              key={index}
              aria-hidden
              className="qu-pulse-ring absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${TOKEN.fg}`,
                animationDelay: `${index * 1.2}s`,
              }}
            />
          ))}
          <Zap size={50} fill={TOKEN.fg} color={TOKEN.fg} strokeWidth={0} />
        </div>
      </div>
    </div>
  )
}
