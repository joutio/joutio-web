import { useEffect, useState, type ReactNode } from 'react'
import { reconnectStomp, useConnectionStore } from '@/lib/realtime'
import { Banner, GlobalBannerContext, type BannerConnection } from '@/ui'

/** Durée d'affichage de « Connexion rétablie ». */
const RESTORED_MS = 2500

/**
 * Bande de connexion globale (`etats-systeme.md`) : réseau et temps réel. `Screen` la lit par `GlobalBannerContext` et
 * la place tout en haut ; les écrans immersifs (duel, matchmaking) l'ignorent.
 */
export function ConnectionBanner({ children }: { children: ReactNode }) {
  const status = useConnectionStore((state) => state.status)
  const restoredAt = useConnectionStore((state) => state.restoredAt)
  // Dernier retour en ligne dont la bande « rétablie » a déjà disparu.
  const [dismissed, setDismissed] = useState<number | null>(null)

  useEffect(() => {
    if (restoredAt == null) return
    const timer = window.setTimeout(() => setDismissed(restoredAt), Math.max(0, restoredAt + RESTORED_MS - Date.now()))
    return () => window.clearTimeout(timer)
  }, [restoredAt])

  const connection: BannerConnection | null =
    status === 'offline'
      ? 'offline'
      : status === 'reconnecting'
        ? 'reconnecting'
        : status === 'online' && restoredAt != null && dismissed !== restoredAt
          ? 'restored'
          : null

  return (
    <GlobalBannerContext.Provider value={connection && <Banner connection={connection} onRetry={() => void reconnectStomp()} />}>
      {children}
    </GlobalBannerContext.Provider>
  )
}
