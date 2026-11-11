import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DevUiPage } from '@/features/dev'
import { DuelPage } from '@/features/duel'
import { OnboardingPage } from '@/features/onboarding'
import { HomePage } from '@/features/home'
import { JoinPage, MatchmakingPage, RoomPage } from '@/features/play'
import { TopicPage } from '@/features/topic'
import { TopicsPage } from '@/features/topics'
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
      { path: '/join/:roomId', element: <JoinPage /> },
      ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <DevUiPage /> }] : []),
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/topics', element: <TopicsPage /> },
          { path: '/topics/:topicId', element: <TopicPage /> },
          { path: '/topics/:topicId/leaderboard', element: <PendingScreen title="pending.leaderboard" /> },
          { path: '/me/games', element: <PendingScreen title="pending.games" /> },
          { path: '/games/:gameId/result', element: <PendingScreen title="pending.result" /> },
          { path: '/games/:gameId', element: <DuelPage /> },
          { path: '/rooms/:roomId', element: <RoomPage /> },
          { path: '/play', element: <MatchmakingPage /> },
          { path: '/premium', element: <PendingScreen title="pending.premium" /> },
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
