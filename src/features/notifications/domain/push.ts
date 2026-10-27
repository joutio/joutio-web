import type { PushSubscriptionPayload } from "@/shared/types/push"

/** Règles pures du push : support navigateur et conversion des clés (testables hors DOM). */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

/** Clé VAPID base64url → tableau d'octets (`applicationServerKey`). */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalized)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes
}

/** Souscription navigateur → payload BFF (`toJSON` normalise endpoint + clés). */
export function subscriptionToPayload(
  subscription: PushSubscription
): PushSubscriptionPayload {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  }
}
