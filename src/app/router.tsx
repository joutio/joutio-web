import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DevUiPage } from '@/features/dev'
import { AppFrame, AuthenticatedLayout, CallbackPage, LoginRedirect, PlaceholderScreen, WelcomePage } from '@/features/shell'

/**
 * URLs de `design/specs/platforms/web.md` § 2. Étapes 1 à 3 du kit : écrans encore vides, ils arrivent dans l'ordre du
 * parcours (web-kit § 6).
 */
export const router = createBrowserRouter([
  {
    element: <AppFrame />,
    children: [
      { path: '/welcome', element: <WelcomePage /> },
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
