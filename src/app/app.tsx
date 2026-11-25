import { createJoutioQueryClient, JoutioClientProvider } from '@joutio/client/core'
import { RouterProvider } from 'react-router-dom'
import { http } from '@/lib/api'
import { realtime } from '@/lib/realtime'
import { useSessionRefresh, useSessionStore } from '@/lib/session'
import { useApplyTheme } from '@/lib/theme'
import { PlatformContext } from '@/ui'
import { router } from './router'

/** Cache de `@joutio/client` (politique de fraîcheur de la lib) : l'app ne le lit ni ne l'écrit jamais. */
const queryClient = createJoutioQueryClient()

// Fin de session (déconnexion, expiration, autre onglet) : les données du joueur précédent partent avec elle.
useSessionStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') queryClient.clear()
})

const clock = () => Date.now()

export function App() {
  useApplyTheme()
  useSessionRefresh()
  return (
    <JoutioClientProvider http={http} realtime={realtime} clock={clock} queryClient={queryClient}>
      {/* Les compositions du lab ne branchent sur la plateforme que pour les écarts web (web.md § 3). */}
      <PlatformContext.Provider value="web">
        <RouterProvider router={router} />
      </PlatformContext.Provider>
    </JoutioClientProvider>
  )
}
