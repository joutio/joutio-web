import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useImmersiveNavigate } from "@/features/shell"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useRemainingSeconds } from "@/shared/hooks/useRemainingSeconds"
import type { ApiError } from "@/shared/types/api"
import {
  apiErrorToast,
  CHALLENGE_ALREADY_PENDING,
  CHALLENGE_QUOTA_EXCEEDED,
} from "@/shared/utils/api-error-toast"
import { showToast } from "@/shared/utils/toast"
import { challengesService } from "../lib/challenges"
import { useSentRematchStore } from "../stores/useSentRematchStore"

/** Cadence de sondage du défi de revanche (fenêtre totale : 10 s côté serveur). */
const POLL_MS = 1_000
/** Filet avant la première lecture du défi (projection indisponible) : 10 s + marge. */
const WATCHDOG_MS = 12_000

export type RematchState = "idle" | "pending" | "accepted" | "refused"

export interface RematchChallengeResult {
  /** Lance une revanche vers l'adversaire : bouton en attente puis navigation auto en salle. */
  start: (params: {
    topicId: string
    opponentId: string
    gameId: string
  }) => void
  /** Défi envoyé, en attente de la réponse de l'adversaire. */
  pending: boolean
  /** Défi explicitement refusé : le bouton reste verrouillé. Une expiration ne le verrouille pas. */
  refused: boolean
  /** Secondes restantes avant expiration (0 hors attente) — affichées dans le bouton. */
  remainingSeconds: number
}

/**
 * Revanche en défi nominatif : crée le défi (TTL 10 s côté matchmaking) puis **suit sa réponse** —
 * accepté → navigation automatique vers la salle (le client y fait son apparition),
 * refusé → toast + bouton verrouillé ; expiré/annulé → toast + bouton **réactivé** pour permettre
 * une nouvelle demande. Le bouton affiche le compte à rebours serveur ; l'attente ne peut donc
 * jamais durer une heure.
 *
 * <p>L'identifiant du défi est un **état** : le sondage ne démarre qu'une fois la création
 * confirmée (sinon le premier tick, déclenché avant la réponse HTTP, ne se replanifiait pas).</p>
 */
export function useRematchChallenge(): RematchChallengeResult {
  const { t } = useTranslation()
  const immersiveNavigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  const { serverNow } = useServerClock()
  const addSentRematch = useSentRematchStore((state) => state.add)
  const removeSentRematch = useSentRematchStore((state) => state.remove)
  const [state, setState] = useState<RematchState>("idle")
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const remainingSeconds = useRemainingSeconds(expiresAt, serverNow)

  const start = useCallback(
    (params: { topicId: string; opponentId: string; gameId: string }): void => {
      if (state !== "idle") return
      setState("pending")
      setChallengeId(null)
      setExpiresAt(null)
      challengesService
        .create(
          {
            topicId: params.topicId,
            opponentId: params.opponentId,
            gameId: params.gameId,
          },
          { skipErrorBus: true }
        )
        .then((created) => {
          setChallengeId(created.id)
          // Corrélation inbox : le toast générique « défi refusé » est supprimé tant que
          // l'écran de résultat porte l'issue de cette revanche.
          addSentRematch(created.id)
          void queryClient.invalidateQueries({
            queryKey: queryKeys.challenges.mine(),
          })
        })
        .catch((error: ApiError | undefined) => {
          setState("idle")
          const blocked =
            error?.type === CHALLENGE_ALREADY_PENDING ||
            error?.type === CHALLENGE_QUOTA_EXCEEDED
          if (blocked) {
            const { title, description } = apiErrorToast({
              statusCode: error.statusCode,
              message: error.message,
              detail: error.detail,
              type: error.type,
            })
            showToast({ tone: "danger", title, description })
            return
          }
          showToast({
            tone: "danger",
            title: t("game.toasts.rematchSendFailed"),
          })
        })
    },
    [state, queryClient, t, addSentRematch]
  )

  // Quitter l'écran rend la main à l'inbox : un refus tardif y produira son toast normal.
  useEffect(() => {
    if (!challengeId) return
    return () => removeSentRematch(challengeId)
  }, [challengeId, removeSentRematch])

  useEffect(() => {
    if (state !== "pending" || !challengeId) return
    let cancelled = false
    let settled = false
    let knownExpiry: string | null = null
    let timer: ReturnType<typeof setTimeout>
    let expiryTimer: ReturnType<typeof setTimeout> | undefined

    /** Refus explicite de l'adversaire : le bouton reste définitivement désactivé. */
    const refuse = (message: string) => {
      if (cancelled || settled) return
      settled = true
      if (expiryTimer) clearTimeout(expiryTimer)
      clearTimeout(timer)
      setExpiresAt(null)
      setState("refused")
      showToast({ tone: "danger", title: message })
    }

    /**
     * Expiration (ou défi annulé/purgé) : le bouton **redevient disponible** pour redemander
     * une revanche. Seul un refus explicite verrouille le bouton.
     */
    const expire = () => {
      if (cancelled || settled) return
      settled = true
      if (expiryTimer) clearTimeout(expiryTimer)
      clearTimeout(timer)
      setExpiresAt(null)
      setState("idle")
      showToast({ tone: "warning", title: t("game.toasts.rematchExpired") })
    }

    // Filet de sécurité avant la première lecture : même si la projection du défi n'est jamais
    // lisible, le bouton ne reste pas en attente au-delà de 10 s (+ marge réseau). Dès que
    // `expiresAt` est connu, il est annulé : c'est le timer serveur qui pilote l'expiration.
    const watchdogTimer = setTimeout(expire, WATCHDOG_MS)

    const poll = async (): Promise<void> => {
      if (cancelled) return
      try {
        const challenge = await challengesService.get(challengeId, {
          skipErrorBus: true,
        })
        if (cancelled) return
        knownExpiry = challenge.expiresAt
        setExpiresAt(challenge.expiresAt)
        // L'échéance serveur est connue : le watchdog de projection n'a plus de raison d'être.
        clearTimeout(watchdogTimer)
        if (!expiryTimer) {
          // Échéance serveur atteinte : le bouton ne reste jamais en attente au-delà des 10 s,
          // même si le prochain tick de sondage est en retard.
          const deadline = Date.parse(challenge.expiresAt)
          const delay = Number.isFinite(deadline)
            ? Math.max(0, deadline - serverNow())
            : POLL_MS
          expiryTimer = setTimeout(expire, delay)
        }
        if (challenge.status === "ACCEPTED" && challenge.roomId) {
          settled = true
          if (expiryTimer) clearTimeout(expiryTimer)
          clearTimeout(watchdogTimer)
          setState("accepted")
          immersiveNavigate(`/rooms/${challenge.roomId}`)
          return
        }
        if (challenge.status === "DECLINED") {
          refuse(t("game.toasts.rematchRefused"))
          return
        }
        if (
          challenge.status === "EXPIRED" ||
          challenge.status === "CANCELLED"
        ) {
          expire()
          return
        }
        timer = setTimeout(() => void poll(), POLL_MS)
      } catch (error) {
        if (cancelled) return
        // 404 juste après la création = projection du défi encore en retard ; une fois
        // l'échéance connue, un 404 signifie que le défi a été purgé.
        if (
          (error as ApiError | undefined)?.statusCode === 404 &&
          knownExpiry
        ) {
          expire()
          return
        }
        timer = setTimeout(() => void poll(), POLL_MS)
      }
    }

    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(watchdogTimer)
      if (expiryTimer) clearTimeout(expiryTimer)
    }
  }, [state, challengeId, immersiveNavigate, t, serverNow])

  return {
    start,
    pending: state === "pending",
    refused: state === "refused",
    remainingSeconds,
  }
}
