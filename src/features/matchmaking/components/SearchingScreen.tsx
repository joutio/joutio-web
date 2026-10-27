import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, Globe, Users } from "lucide-react"
import { TOKEN } from "@/shared/theme/tokens"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useCountdownTicks } from "@/shared/hooks/useCountdownTicks"
import { WaitingStatusPill } from "@/shared/components/waiting-status-pill"
import { WaitingTopic } from "@/shared/components/waiting-topic"

/** Positions des pastilles sur la carte, en pourcentage. Purement décoratif. */
const PIN_SPOTS = [
  { x: 14, y: 30 },
  { x: 22, y: 52 },
  { x: 31, y: 22 },
  { x: 38, y: 44 },
  { x: 46, y: 28 },
  { x: 52, y: 58 },
  { x: 61, y: 36 },
  { x: 69, y: 24 },
  { x: 74, y: 55 },
  { x: 83, y: 40 },
  { x: 88, y: 66 },
  { x: 27, y: 70 },
]

/** Couleurs des pastilles (joueurs anonymes en attente d'appariement). */
const PIN_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#ef4444",
]

/** Critères d'appariement (Matchmaking côté serveur). */
const CRITERIA = [
  { icon: Users, labelKey: "game.matchmaking.criteria.elo" },
  { icon: Globe, labelKey: "game.matchmaking.criteria.country" },
  { icon: Bot, labelKey: "game.matchmaking.criteria.botFallback" },
] as const

interface SearchingScreenProps {
  topic: {
    name: string
    emoji?: string
    color?: string
    imageUrl?: string
    category?: string | null
    categoryLabel?: string | null
  }
  /** Fin de la fenêtre de recherche (10 s) — échéance serveur du compte à rebours. */
  deadlineAt?: string | null
}

/**
 * Secondes restantes avant l'échéance, rafraîchies ~4×/s (cadence fine pour tomber juste sur
 * les frontières de seconde). `null` tant qu'il n'y a pas d'échéance exploitable.
 */
function useSecondsLeft(
  deadlineAt: string | null | undefined,
  serverNow: () => number
): number | null {
  const [now, setNow] = useState(() => serverNow())

  useEffect(() => {
    const id = window.setInterval(() => setNow(serverNow()), 250)
    return () => window.clearInterval(id)
  }, [serverNow])

  const deadline = deadlineAt ? Date.parse(deadlineAt) : Number.NaN
  if (Number.isNaN(deadline)) return null
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

/**
 * File de matchmaking (duel humain) — carte de pastilles de joueurs, sujet en cours, critères
 * d'appariement et **décompte des secondes intégré à la pastille « Recherche d'un adversaire… »**.
 * À l'échéance (10 s) le ticket expire : selon la préférence du joueur, la page lance
 * automatiquement un entraînement ou propose de relancer une recherche. Le déroulé réel
 * (ticket + WebSocket) est piloté par `MatchmakingPage`.
 */
export function SearchingScreen({ topic, deadlineAt }: SearchingScreenProps) {
  const { t } = useTranslation()
  const { serverNow } = useServerClock()
  const secondsLeft = useSecondsLeft(deadlineAt, serverNow)

  // Tic-tac de la fenêtre de recherche — muet si l'interrupteur « Sons » est coupé. La hauteur
  // reste constante : la recherche de 10 s ne doit pas s'accélérer à l'approche de l'échéance.
  useCountdownTicks({ deadlineAt, clock: serverNow, tense: false })

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${TOKEN.secondary} 1.4px, color-mix(in srgb, ${TOKEN.secondary} 0%, transparent) 1.4px)`,
          backgroundSize: "13px 13px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 40%, transparent 100%)",
        }}
      />
      <div
        className="qu-halo pointer-events-none absolute top-[38%] left-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${topic.color ?? TOKEN.primary} 22%, transparent), color-mix(in srgb, ${topic.color ?? TOKEN.primary} 0%, transparent) 65%)`,
        }}
      />
      <div className="pointer-events-none absolute top-[38%] left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="qu-ping col-start-1 row-start-1 size-[180px] place-self-center rounded-full"
            style={{
              border: `1.5px solid ${TOKEN.primary}`,
              animationDelay: `${index * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex-1">
        {PIN_SPOTS.map((spot, index) => (
          <div
            key={`${spot.x}-${spot.y}`}
            className="qu-bob absolute"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              animationDelay: `${(index % 5) * 0.4}s`,
            }}
          >
            <div
              className="flex size-[34px] items-center justify-center"
              style={{
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                background: PIN_COLORS[index % PIN_COLORS.length],
                opacity: 0.9,
                boxShadow: "0 6px 14px rgba(0,0,0,.55)",
              }}
            >
              <Users
                size={14}
                style={{ transform: "rotate(45deg)", color: "#0b0b0d" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-4 pb-8 text-center">
        <WaitingTopic topic={topic} size={56} />

        {/* Statut et temps restant dans **une seule** pastille jaune : les secondes sont
            intégrées à « Recherche d'un adversaire ». */}
        <WaitingStatusPill
          label={t("game.matchmaking.searching")}
          trailing={
            secondsLeft != null ? (
              <span
                className="tabular-nums"
                style={{ letterSpacing: "0.02em" }}
              >
                {t("game.matchmaking.seconds", { count: secondsLeft })}
              </span>
            ) : undefined
          }
        />

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          {CRITERIA.map((criterion) => (
            <span
              key={criterion.labelKey}
              className="flex items-center gap-1.5"
              style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
            >
              <criterion.icon size={12} /> {t(criterion.labelKey)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
