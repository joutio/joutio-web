/** Contrats Web Push du BFF (`/api/push`). */

export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

/** Payload de `PushManager.subscribe()` envoyé au BFF (l'actor vient du JWT). */
export interface PushSubscriptionPayload {
  endpoint: string
  keys: PushSubscriptionKeys
}

export interface VapidPublicKeyView {
  publicKey: string
}
