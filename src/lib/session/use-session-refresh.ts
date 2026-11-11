import { useEffect } from 'react'
import { refreshSessionOrEnd } from './session'
import { useSessionStore } from './session-store'

const TICK_MS = 60_000
/** Renouvellement anticipé : moins de 5 min avant l'échéance. */
const MARGIN_MS = 5 * 60_000

/** Renouvellement piloté : chaque minute, au retour d'onglet et au retour réseau. */
export function useSessionRefresh(): void {
  const authenticated = useSessionStore((state) => state.tokens !== null)

  useEffect(() => {
    if (!authenticated) return
    const renewIfNeeded = () => {
      const tokens = useSessionStore.getState().tokens
      if (tokens && tokens.expiresAt - Date.now() < MARGIN_MS) void refreshSessionOrEnd()
    }
    const onVisible = () => document.visibilityState === 'visible' && renewIfNeeded()
    renewIfNeeded()
    const timer = window.setInterval(renewIfNeeded, TICK_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', renewIfNeeded)
    window.addEventListener('pageshow', renewIfNeeded)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', renewIfNeeded)
      window.removeEventListener('pageshow', renewIfNeeded)
    }
  }, [authenticated])
}
