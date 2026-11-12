/**
 * Service Worker Joutio : notifications Web Push uniquement (web-kit § 4).
 * Les textes par type de notification arrivent avec l'écran Notifications (étape 4) ; d'ici là, le payload
 * `{ title?, body?, path? }` s'affiche tel quel. Si une fenêtre de l'app est visible, on ne double pas la notification
 * système : le temps réel met déjà l'inbox à jour.
 */
const ICON = '/icons/icon-192.png'
const BADGE = '/icons/badge-72.png'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.some((client) => client.visibilityState === 'visible')) return
      await self.registration.showNotification(typeof data.title === 'string' ? data.title : 'Joutio', {
        body: typeof data.body === 'string' ? data.body : undefined,
        icon: ICON,
        badge: BADGE,
        data: { path: typeof data.path === 'string' && data.path.startsWith('/') ? data.path : '/notifications' },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.path ?? '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (existing) {
        await existing.focus()
        return existing.navigate(path)
      }
      return self.clients.openWindow(path)
    })(),
  )
})
