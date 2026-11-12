import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { useSessionRefresh } from '@/lib/session'
import { useApplyTheme } from '@/lib/theme'
import { PlatformContext } from '@/ui'
import { router } from './router'

export function App() {
  useApplyTheme()
  useSessionRefresh()
  return (
    <QueryClientProvider client={queryClient}>
      {/* Les compositions du lab ne branchent sur la plateforme que pour les écarts web (web.md § 3). */}
      <PlatformContext.Provider value="web">
        <RouterProvider router={router} />
      </PlatformContext.Provider>
    </QueryClientProvider>
  )
}
