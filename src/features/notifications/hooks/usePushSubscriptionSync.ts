import { useEffect } from "react"
import { useSession } from "@/features/auth"
import { isPushSupported, subscriptionToPayload } from "../domain/push"
import { pushService } from "../lib/push"
import {
  ensureBrowserSubscription,
  getBrowserSubscription,
  readBoundUserId,
  writeBoundUserId,
} from "../lib/push-client"

let inFlight: Promise<void> | null = null

/** Re-souscrit si besoin puis rebinde le navigateur sur le joueur courant (idempotent). */
function bind(userId: string): Promise<void> {
  inFlight ??= (async () => {
    const subscription = await ensureBrowserSubscription()
    if (readBoundUserId() !== userId) {
      await pushService.subscribe(subscriptionToPayload(subscription))
      writeBoundUserId(userId)
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}

/** Retire l'abonnement navigateur et le binding local (déconnexion). */
function unbind(): Promise<void> {
  inFlight ??= (async () => {
    const subscription = await getBrowserSubscription()
    if (subscription) {
      await pushService
        .unsubscribe(subscription.endpoint)
        .catch(() => undefined)
      await subscription.unsubscribe().catch(() => undefined)
    }
    writeBoundUserId(null)
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}

/**
 * Synchronise l'abonnement push avec la session (monté dans `AppShell`) :
 * - login : re-souscrit silencieusement si le navigateur a perdu l'abonnement
 *   (`pushsubscriptionchange`, données de site effacées) puis rebinde sur le joueur courant ;
 * - logout : retire l'abonnement pour ne pas pousser les notifications d'un compte vers un autre.
 */
export function usePushSubscriptionSync(): void {
  const { authenticated, userId } = useSession()

  useEffect(() => {
    if (!isPushSupported() || Notification.permission !== "granted") return
    if (authenticated && userId) {
      void bind(userId).catch(() => undefined)
    } else if (!authenticated && readBoundUserId()) {
      void unbind().catch(() => undefined)
    }
  }, [authenticated, userId])
}
