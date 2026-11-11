import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DevUiPage } from '@/features/dev'
import { OnboardingPage } from '@/features/onboarding'
import { AppFrame, AuthenticatedLayout, CallbackPage, LoginRedirect, PlaceholderScreen } from '@/features/shell'

/**
 * URLs de `design/specs/platforms/web.md` § 2. Les écrans arrivent dans l'ordre du parcours (web-kit § 6) ;
 * ceux qui manquent encore sont des placeholders.
 */
export const router = createBrowserRouter([
  {
    element: <AppFrame />,
    children: [
      { path: '/welcome', element: <OnboardingPage /> },
      { path: '/login', element: <LoginRedirect /> },
      { path: '/callback', element: <CallbackPage /> },
      ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <DevUiPage /> }] : []),
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: '/', element: <PlaceholderScreen tab="home" /> },
          { path: '/topics', element: <PlaceholderScreen tab="topics" /> },
          { path: '/social', element: <PlaceholderScreen tab="social" /> },
          { path: '/challenges', element: <PlaceholderScreen tab="challenges" /> },
          { path: '/me', element: <PlaceholderScreen tab="profile" /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
