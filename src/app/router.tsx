import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DevUiPage } from '@/features/dev'
import { OnboardingPage } from '@/features/onboarding'
import { HomePage } from '@/features/home'
import { AppFrame, AuthenticatedLayout, CallbackPage, LoginRedirect, PendingScreen, PlaceholderScreen } from '@/features/shell'

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
          { path: '/', element: <HomePage /> },
          { path: '/topics', element: <PlaceholderScreen tab="topics" /> },
          { path: '/topics/:topicId', element: <PendingScreen title="pending.topic" /> },
          { path: '/notifications', element: <PendingScreen title="pending.notifications" /> },
          { path: '/search', element: <PendingScreen title="pending.search" /> },
          { path: '/social', element: <PlaceholderScreen tab="social" /> },
          { path: '/challenges', element: <PlaceholderScreen tab="challenges" /> },
          { path: '/me', element: <PlaceholderScreen tab="profile" /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
