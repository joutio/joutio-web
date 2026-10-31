import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  GlobeHemisphereWestIcon,
  RobotIcon,
  UsersIcon,
} from "@phosphor-icons/react"
import { TOKEN } from "@/shared/theme/tokens"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useCountdownTicks } from "@/shared/hooks/useCountdownTicks"
import { WaitingStatusPill } from "@/shared/components/waiting-status-pill"
import { WaitingTopic } from "@/shared/components/waiting-topic"
import { MatchmakingMap, type FoundOpponent } from "./matchmaking-map"

/** Critères d'appariement (Matchmaking côté serveur). */
const CRITERIA = [
  { icon: UsersIcon, labelKey: "game.matchmaking.criteria.elo" },
  {
    icon: GlobeHemisphereWestIcon,
    labelKey: "game.matchmaking.criteria.country",
  },
  { icon: RobotIcon, labelKey: "game.matchmaking.criteria.botFallback" },
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
  /** Adversaire trouvé : la carte se centre sur son pays avant la bascule vers la salle. */
  found?: FoundOpponent | null
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
export function SearchingScreen({
  topic,
  deadlineAt,
  found = null,
}: SearchingScreenProps) {
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
      <MatchmakingMap found={found} />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-4 pb-8 text-center">
        <WaitingTopic topic={topic} size={56} />

        {/* Statut et temps restant dans **une seule** pastille jaune : les secondes sont
            intégrées à « Recherche d'un adversaire ». */}
        <WaitingStatusPill
          label={
            found
              ? t("game.matchmaking.opponentFound")
              : t("game.matchmaking.searching")
          }
          trailing={
            !found && secondsLeft != null ? (
              <span
                className="font-mono tabular-nums"
                style={{ letterSpacing: "0.02em" }}
              >
                {t("game.matchmaking.seconds", { count: secondsLeft })}
              </span>
            ) : undefined
          }
        />

        {!found && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {CRITERIA.map((criterion) => (
              <span
                key={criterion.labelKey}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: TOKEN.mutedFg }}
              >
                <criterion.icon size={12} /> {t(criterion.labelKey)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
