import { subscriptionToPayload, urlBase64ToUint8Array } from "../domain/push"
import { pushService } from "./push"

/**
 * Accès navigateur au push (impératif) : souscription/retrait et binding local du joueur.
 * Le binding (`joutio.push.boundUser`) évite les fuites inter-comptes : si un autre joueur se
 * connecte sur le même navigateur, l'abonnement est rebindé ; à la déconnexion il est retiré.
 */
const PUSH_BOUND_USER_KEY = "joutio.push.boundUser"

let vapidKeyPromise: Promise<string> | null = null

/** Clé VAPID publique (mise en cache module : une requête par session de page). */
export function getVapidPublicKey(): Promise<string> {
  vapidKeyPromise ??= pushService
    .vapidPublicKey()
    .then((view) => view.publicKey)
    .catch((error: unknown) => {
      vapidKeyPromise = null
      throw error
    })
  return vapidKeyPromise
}

/** Service Worker actif (l'enregistrement est fait au boot par `main.tsx`). */
export async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready
}

export async function getBrowserSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration()
  return registration.pushManager.getSubscription()
}

/** Souscription existante ou création silencieuse (permission déjà accordée). */
export async function ensureBrowserSubscription(): Promise<PushSubscription> {
  const existing = await getBrowserSubscription()
  if (existing) return existing

  const publicKey = await getVapidPublicKey()
  const registration = await getRegistration()
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

export function readBoundUserId(): string | null {
  try {
    return localStorage.getItem(PUSH_BOUND_USER_KEY)
  } catch {
    return null
  }
}

export function writeBoundUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(PUSH_BOUND_USER_KEY, userId)
    } else {
      localStorage.removeItem(PUSH_BOUND_USER_KEY)
    }
  } catch {
    // Stockage indisponible (navigation privée) : le binding est simplement non persisté.
  }
}

/**
 * Demande la permission puis (re)souscrit le navigateur et le binde au joueur. Retourne la
 * permission résultante. Sur iOS la demande doit venir d'un geste utilisateur : l'échec implicite
 * est silencieux, l'activation reste possible depuis les Réglages.
 */
export async function enableBrowserPush(
  userId: string | null
): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return permission
  const subscription = await ensureBrowserSubscription()
  await pushService.subscribe(subscriptionToPayload(subscription))
  writeBoundUserId(userId)
  return permission
}
