import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { LightningIcon } from "@phosphor-icons/react"
import { AppShell, ComingSoonPage } from "@/features/shell"
import { useFeatureFlag } from "@/shared/hooks/use-feature-flag"
import { RequireAuth } from "./RequireAuth"
import { OnboardingGate } from "./OnboardingGate"

/**
 * Routes chargées à la demande : chaque page est un chunk séparé, le shell reste eager.
 * Les features sont importées via leur API publique (barrel `@/features/<nom>`).
 */
/**
 * Galerie de référence du design system, réservée au développement.
 * `import.meta.env.DEV` est remplacé statiquement par Vite : la route et son
 * chunk ne sont pas référencés dans le build de production.
 */
const DesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import("@/features/design-system/pages").then((m) => ({
        default: m.DesignSystemPage,
      }))
    )
  : null

const HomePage = lazy(() =>
  import("@/features/home/pages").then((m) => ({ default: m.HomePage }))
)
const OnboardingPage = lazy(() =>
  import("@/features/home/pages").then((m) => ({ default: m.OnboardingPage }))
)
const TopicsPage = lazy(() =>
  import("@/features/topics/pages").then((m) => ({ default: m.TopicsPage }))
)
const CreateTopicPage = lazy(() =>
  import("@/features/topic-authoring/pages").then((m) => ({
    default: m.CreateTopicPage,
  }))
)
const TopicManagePage = lazy(() =>
  import("@/features/topic-authoring/pages").then((m) => ({
    default: m.TopicManagePage,
  }))
)
const TopicDetailPage = lazy(() =>
  import("@/features/topic-detail/pages").then((m) => ({
    default: m.TopicDetailPage,
  }))
)
const ProfilePage = lazy(() =>
  import("@/features/account/pages").then((m) => ({ default: m.ProfilePage }))
)
const SettingsPage = lazy(() =>
  import("@/features/account/pages").then((m) => ({ default: m.SettingsPage }))
)
const AvatarEditorPage = lazy(() =>
  import("@/features/account/pages").then((m) => ({
    default: m.AvatarEditorPage,
  }))
)
const ProgressionPage = lazy(() =>
  import("@/features/progression/pages").then((m) => ({
    default: m.ProgressionPage,
  }))
)
const SocialPage = lazy(() =>
  import("@/features/social/pages").then((m) => ({ default: m.SocialPage }))
)
const ChallengesPage = lazy(() =>
  import("@/features/social/pages").then((m) => ({ default: m.ChallengesPage }))
)
const PlayerProfilePage = lazy(() =>
  import("@/features/player/pages").then((m) => ({
    default: m.PlayerProfilePage,
  }))
)
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages").then((m) => ({
    default: m.NotificationsPage,
  }))
)
const RoomPage = lazy(() =>
  import("@/features/rooms/pages").then((m) => ({ default: m.RoomPage }))
)
const JoinRoomPage = lazy(() =>
  import("@/features/rooms/pages").then((m) => ({ default: m.JoinRoomPage }))
)
const GamePage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.GamePage }))
)
const GameResultPage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.GameResultPage }))
)
const MatchmakingPage = lazy(() =>
  import("@/features/matchmaking/pages").then((m) => ({
    default: m.MatchmakingPage,
  }))
)
const LoginPage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.LoginPage }))
)
const VerifyCodePage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.VerifyCodePage }))
)
const CallbackPage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.CallbackPage }))
)
const PrivacyPage = lazy(() =>
  import("@/features/legal/pages").then((m) => ({ default: m.PrivacyPage }))
)
const TermsPage = lazy(() =>
  import("@/features/legal/pages").then((m) => ({ default: m.TermsPage }))
)
const DataDeletionPage = lazy(() =>
  import("@/features/legal/pages").then((m) => ({
    default: m.DataDeletionPage,
  }))
)

function RouteFallback() {
  return (
    <div className="grid min-h-svh place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-14 place-items-center rounded-full bg-foreground text-background motion-safe:animate-pulse">
          <LightningIcon className="size-6 fill-current" />
        </div>
        <p className="font-heading text-sm font-semibold">Joutio</p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  const topicAuthoring = useFeatureFlag("topicAuthoring")
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/code" element={<VerifyCodePage />} />
        <Route path="/callback" element={<CallbackPage />} />
        {/* Pages publiques exigées par les consoles Meta / Google. */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
        {DesignSystemPage ? (
          <Route path="/design-system" element={<DesignSystemPage />} />
        ) : null}

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <OnboardingGate>
                <AppShell />
              </OnboardingGate>
            </RequireAuth>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route
            path="/topics/new"
            element={topicAuthoring ? <CreateTopicPage /> : <ComingSoonPage />}
          />
          <Route
            path="/topics/:topicId/manage"
            element={topicAuthoring ? <TopicManagePage /> : <ComingSoonPage />}
          />
          <Route path="/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/game/:gameId/result" element={<GameResultPage />} />
          <Route path="/matchmaking/:ticketId" element={<MatchmakingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
          <Route path="/join/:roomId" element={<JoinRoomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/avatar" element={<AvatarEditorPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          {/* Ancienne route « Personnes » : conservée pour les liens profonds et favoris. */}
          <Route path="/people" element={<Navigate to="/social" replace />} />
          <Route path="/players/:playerId" element={<PlayerProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
