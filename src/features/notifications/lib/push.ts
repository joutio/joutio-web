import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type {
  PushSubscriptionPayload,
  VapidPublicKeyView,
} from "@/shared/types/push"

/**
 * Web Push : clé VAPID publique + enregistrement idempotent de l'abonnement navigateur.
 * `skipErrorBus` : l'activation est pilotée par les Réglages (toast dédié), la synchro de
 * session est silencieuse — on ne veut pas de toast global sur ces échecs.
 */
export const pushService = {
  vapidPublicKey: (): Promise<VapidPublicKeyView> =>
    api.get<VapidPublicKeyView>(ENDPOINTS.push.vapidPublicKey, {
      skipErrorBus: true,
    }),

  subscribe: (payload: PushSubscriptionPayload): Promise<void> =>
    api.put<void>(ENDPOINTS.push.subscriptions, payload, {
      skipErrorBus: true,
    }),

  unsubscribe: (endpoint: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.push.subscriptions, {
      params: { endpoint },
      skipErrorBus: true,
    }),
}
