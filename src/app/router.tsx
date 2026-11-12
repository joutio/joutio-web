import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ChallengesPage } from '@/features/challenges'
import { DevUiPage } from '@/features/dev'
import { DuelPage } from '@/features/duel'
import { OnboardingPage } from '@/features/onboarding'
import { HistoryPage } from '@/features/history'
import { HomePage } from '@/features/home'
import { NotificationsPage } from '@/features/notifications'
import { JoinPage, MatchmakingPage, RoomPage } from '@/features/play'
import { PlayerPage } from '@/features/player'
import { PremiumRoute } from '@/features/premium'
import { PlayedTopicsPage, ProfilePage, StreakPage, TitlesPage } from '@/features/profile'
import { ResultPage } from '@/features/result'
import { AvatarEditorPage, DeleteAccountPage, SettingsPage } from '@/features/settings'
import { SearchPage } from '@/features/search'
import { SocialPage } from '@/features/social'
import { LeaderboardPage, TopicPage } from '@/features/topic'
import { TopicsPage } from '@/features/topics'
import { ModerationPage, MyTopicPage, MyTopicsPage, QuestionEditorPage, QuestionReportsPage, QuestionsPage, TeamPage } from '@/features/workshop'
import { AppFrame, AuthenticatedLayout, CallbackPage, LoginRedirect } from '@/features/shell'
import { PersonalRuntime } from './personal-runtime'

/**
 * URLs de `design/specs/platforms/web.md` § 2 ; les 13 écrans du kit (web-kit § 6) sont portés.
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
          {
            element: <PersonalRuntime />,
            children: [
              { path: '/', element: <HomePage /> },
              { path: '/topics', element: <TopicsPage /> },
              { path: '/topics/:topicId', element: <TopicPage /> },
              { path: '/topics/:topicId/leaderboard', element: <LeaderboardPage /> },
              { path: '/me/games', element: <HistoryPage /> },
              { path: '/me/titles', element: <TitlesPage /> },
              { path: '/me/streak', element: <StreakPage /> },
              { path: '/me/played', element: <PlayedTopicsPage /> },
              { path: '/me/settings', element: <SettingsPage /> },
              { path: '/me/settings/avatar', element: <AvatarEditorPage /> },
              { path: '/me/settings/delete', element: <DeleteAccountPage /> },
              { path: '/players/:userId', element: <PlayerPage /> },
              { path: '/games/:gameId/result', element: <ResultPage /> },
              { path: '/games/:gameId', element: <DuelPage /> },
              { path: '/rooms/:roomId', element: <RoomPage /> },
              { path: '/play', element: <MatchmakingPage /> },
              { path: '/premium', element: <PremiumRoute /> },
              { path: '/notifications', element: <NotificationsPage /> },
              { path: '/me/topics', element: <MyTopicsPage /> },
              { path: '/me/topics/:topicId', element: <MyTopicPage /> },
              { path: '/me/topics/:topicId/questions', element: <QuestionsPage /> },
              { path: '/me/topics/:topicId/questions/:questionId', element: <QuestionEditorPage /> },
              { path: '/me/topics/:topicId/team', element: <TeamPage /> },
              { path: '/me/topics/:topicId/moderation', element: <ModerationPage /> },
              { path: '/me/topics/:topicId/reports/:questionId', element: <QuestionReportsPage /> },
              { path: '/search', element: <SearchPage /> },
              { path: '/social', element: <SocialPage /> },
              { path: '/challenges', element: <ChallengesPage /> },
              { path: '/me', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
