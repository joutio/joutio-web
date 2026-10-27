import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Zap } from "lucide-react"
import { cn } from "cn"
import { Countdown } from "@/components/arc/countdown/countdown"
import { Stepper } from "@/components/arc/stepper/stepper"
import { TOKEN } from "@/shared/theme/tokens"
import {
  PREPARATION_STEPS,
  preparationComplete,
  preparationStep,
  waitingStatusLabel,
  type RoomStatus,
} from "../domain/room"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useCountdownTicks } from "@/shared/hooks/useCountdownTicks"
import { WaitingTopic } from "@/shared/components/waiting-topic"
import { RoomEmptySlot } from "./RoomEmptySlot"
import { RoomPlayerSlot, type RoomSlot } from "./RoomPlayerSlot"

interface RoomWaitingScreenProps {
  topic: {
    name: string
    emoji?: string
    color?: string
    imageUrl?: string
    category?: string | null
    categoryLabel?: string | null
  }
  /** Statut serveur de la salle : pilote le stepper d'avancement de la préparation. */
  status: RoomStatus
  /** Le joueur courant (toujours affiché à gauche). */
  player: RoomSlot
  /** L'adversaire ; `null` tant qu'aucun second joueur (salon partagé). */
  opponent: RoomSlot | null
  expiresAt?: string | null
  /** Contenu additionnel (partage lien + QR pour un salon non partagé). */
  children?: ReactNode
}

/**
 * Salle d'attente : les deux avatars face à face avec leur présence temps réel, sujet en tête,
 * état + stepper d'avancement de la préparation + expiration du salon en pied. Le QR/partage
 * éventuel est fourni en `children`.
 */
export function RoomWaitingScreen({
  topic,
  status,
  player,
  opponent,
  expiresAt,
  children,
}: RoomWaitingScreenProps) {
  const { t } = useTranslation()
  const { serverNow } = useServerClock()

  // Tic-tac **continu** de la salle d'attente (expiration à 1 jour : la fenêtre des dix dernières
  // secondes ne sonnerait jamais) — la tension revient si l'expiration approche vraiment.
  useCountdownTicks({
    deadlineAt: expiresAt,
    clock: serverNow,
    continuous: true,
  })

  const bothPresent = player.present && (opponent?.present ?? false)
  // Desktop : partage/QR en colonne de droite quand il y a du contenu additionnel ; sinon la
  // salle reste centrée sur une seule colonne (défi nominatif, pas de partage social).
  const hasAside = Boolean(children)
  const waitingLabel = waitingStatusLabel(
    {
      playerPresent: player.present,
      opponentPresent: opponent?.present ?? false,
      opponentLabel: opponent
        ? opponent.isMe
          ? t("game.room.status.you")
          : opponent.name
        : null,
    },
    t
  )
  // La première étape porte le libellé dynamique d'attente (nom de l'adversaire attendu).
  const steps = PREPARATION_STEPS.map((step, index) => ({
    id: step.id,
    label: t(step.labelKey),
    description: index === 0 ? waitingLabel : t(step.descriptionKey),
  }))
  const complete = preparationComplete(status)

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
            "radial-gradient(ellipse 70% 60% at 50% 42%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 42%, #000 40%, transparent 100%)",
        }}
      />

      <div className="relative flex-1 overflow-y-auto overscroll-y-contain">
        <div
          className={cn(
            "flex min-h-full flex-col items-center justify-center gap-7 px-6 py-8",
            hasAside &&
              "desktop:grid desktop:h-full desktop:min-h-0 desktop:grid-cols-2 desktop:items-center desktop:gap-12 desktop:px-10 desktop:py-6"
          )}
        >
          <div className="flex flex-col items-center gap-7">
            <WaitingTopic topic={topic} size={56} />

            <div className="flex items-start justify-center gap-4">
              <RoomPlayerSlot slot={player} />
              <div
                className={cn(
                  "mt-4 grid size-9 place-items-center rounded-full border transition-colors duration-300",
                  bothPresent
                    ? "text-[var(--duel-correct-accent)]"
                    : "text-muted-foreground"
                )}
                style={{
                  borderColor: bothPresent ? TOKEN.correctAccent : TOKEN.border,
                }}
                aria-hidden
              >
                <Zap
                  size={16}
                  fill={bothPresent ? TOKEN.correctAccent : "transparent"}
                />
              </div>
              {opponent ? (
                <RoomPlayerSlot slot={opponent} />
              ) : (
                <RoomEmptySlot />
              )}
            </div>

            <div className="flex w-full max-w-[420px] flex-col items-center gap-3.5 text-center">
              {/* Wrapper du stepper : jaune pendant la préparation, vert dès qu'elle est
                  terminée (lancement en cours). */}
              <div
                className="w-full rounded-2xl border px-4 py-3.5 transition-colors duration-300"
                style={{
                  borderColor: complete
                    ? `color-mix(in srgb, ${TOKEN.correctAccent} 35%, transparent)`
                    : `color-mix(in srgb, ${TOKEN.score} 35%, transparent)`,
                  background: complete
                    ? `color-mix(in srgb, ${TOKEN.correctAccent} 8%, transparent)`
                    : `color-mix(in srgb, ${TOKEN.score} 8%, transparent)`,
                }}
              >
                <Stepper
                  steps={steps}
                  current={preparationStep(status)}
                  orientation="horizontal"
                  details="current"
                  label={t("game.room.stepperLabel")}
                  completeLabel={t("game.room.stepperComplete")}
                  className="w-full"
                />
              </div>
              {/* Expiration du salon : visible jusqu'au départ (la partie démarre immédiatement
                  en fin de préparation, plus de compte à rebours de lancement). */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                {expiresAt && (
                  <Countdown
                    target={expiresAt}
                    units={["hours", "minutes", "seconds"]}
                    variant="compact"
                    fullWidth
                    clock={serverNow}
                    label={t("game.room.expiresIn")}
                    completeLabel={t("game.room.expiredShort")}
                    className="max-w-[380px] [--countdown-complete:var(--danger)]"
                  />
                )}
              </div>
            </div>
          </div>

          {hasAside ? (
            <div className="flex w-full items-center justify-center">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
