import { api } from '../api/api-client'
import { isApiError } from '../api/api-error'
import { ENDPOINTS } from '../endpoints'

/**
 * Web Push (`web.md` § 3) : la permission du navigateur se demande **après une action explicite** du joueur
 * (onboarding, Réglages), jamais au chargement. Le Service Worker (`public/sw.js`) affiche les notifications.
 */
export type PushAvailability = 'unsupported' | 'unconfigured' | 'denied' | 'default' | 'granted'

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export function pushPermission(): PushAvailability {
  return supported() ? Notification.permission : 'unsupported'
}

async function vapidKey(): Promise<string | null> {
  try {
    return (await api.get<{ publicKey: string }>(ENDPOINTS.push.vapidPublicKey)).publicKey
  } catch (error) {
    if (isApiError(error) && error.statusCode === 404) return null
    throw error
  }
}

const toKey = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** À appeler depuis un clic : demande la permission, abonne le navigateur et enregistre l'abonnement au BFF. */
export async function enablePush(): Promise<PushAvailability> {
  if (!supported()) return 'unsupported'
  const key = await vapidKey()
  if (!key) return 'unconfigured'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission
  const registration = await navigator.serviceWorker.register('/sw.js')
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) }))
  await api.put<void>(ENDPOINTS.push.subscriptions, subscription.toJSON())
  return 'granted'
}

/** Désabonne le navigateur (Réglages, déconnexion). */
export async function disablePush(): Promise<void> {
  if (!supported()) return
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await api.delete<void>(ENDPOINTS.push.subscriptions, { query: { endpoint: subscription.endpoint } }).catch(() => undefined)
  await subscription.unsubscribe()
}
