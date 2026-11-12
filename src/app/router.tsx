import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DevUiPage } from '@/features/dev'
import { DuelPage } from '@/features/duel'
import { OnboardingPage } from '@/features/onboarding'
import { HistoryPage } from '@/features/history'
import { HomePage } from '@/features/home'
import { JoinPage, MatchmakingPage, RoomPage } from '@/features/play'
import { PlayerPage } from '@/features/player'
import { PlayedTopicsPage, ProfilePage, StreakPage, TitlesPage } from '@/features/profile'
import { ResultPage } from '@/features/result'
import { LeaderboardPage, TopicPage } from '@/features/topic'
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
          { path: '/topics/:topicId/leaderboard', element: <LeaderboardPage /> },
          { path: '/me/games', element: <HistoryPage /> },
          { path: '/me/titles', element: <TitlesPage /> },
          { path: '/me/streak', element: <StreakPage /> },
          { path: '/me/played', element: <PlayedTopicsPage /> },
          { path: '/me/settings', element: <PendingScreen title="profile.settings" /> },
          { path: '/players/:userId', element: <PlayerPage /> },
          { path: '/games/:gameId/result', element: <ResultPage /> },
          { path: '/games/:gameId', element: <DuelPage /> },
          { path: '/rooms/:roomId', element: <RoomPage /> },
          { path: '/play', element: <MatchmakingPage /> },
          { path: '/premium', element: <PendingScreen title="pending.premium" /> },
          { path: '/notifications', element: <PendingScreen title="pending.notifications" /> },
          { path: '/search', element: <PendingScreen title="pending.search" /> },
          { path: '/social', element: <PlaceholderScreen tab="social" /> },
          { path: '/challenges', element: <PlaceholderScreen tab="challenges" /> },
          { path: '/me', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
