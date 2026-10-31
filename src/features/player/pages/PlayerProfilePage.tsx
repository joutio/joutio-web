import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Flag, Swords, UserCheck, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportUserDialog } from "@/features/moderation"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { EmptyState } from "@/shared/components/empty-state"
import { UserAvatar } from "@/shared/components/user-avatar"
import { WinLossBar } from "@/shared/components/win-loss-bar"
import { PresenceBadge } from "@/shared/components/PresenceBadge"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { PageContainer } from "@/features/shell"
import { GameHistorySection } from "@/features/player"
import { ThemePickerDialog } from "@/features/game"
import { useCreateChallenge } from "@/features/challenges"
import { getSessionUserId as getUserId } from "@/features/auth"
import {
  TitleRibbon,
  useEquippedTitle,
  useEquippedTitleLabel,
  usePlayerTitles,
} from "@/features/progression"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { EloBadge, eloTier } from "@/features/progression"
import { useLocale } from "@/lib/i18n/useLocale"
import { usePresence } from "@/shared/hooks/usePresence"
import type { PlayerProfile } from "../domain/profile"
import { ProfileBanner } from "../components/ProfileBanner"
import {
  useHeadToHead,
  usePlayerProfile,
  useToggleUserFollow,
} from "../hooks/usePlayer"

/**
 * Fiche d'un autre joueur : identité complète, actions, face-à-face **du point de vue du
 * viewer** (V/N/D + historique de leurs duels communs). Aucun onglet Statistiques/Badges, aucune
 * statistique globale. Le compte système bot est réduit à son avatar et à son nom.
 */
export function PlayerProfilePage() {
  const { t } = useTranslation()
  const { playerId = "" } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const { data: profile, isLoading, isError } = usePlayerProfile(playerId)

  // Une seule page « soi » : `/players/<monId>` redirige vers `/profile`.
  if (profile?.isMe) {
    return <Navigate to="/profile" replace />
  }

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("player.profile.loading")}
        </p>
      </PageContainer>
    )
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <EmptyState title={t("player.profile.notFound")}>
          <Button variant="outline" onClick={() => void navigate("/social")}>
            {t("player.profile.backToSocial")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const name = profile.pseudonym ?? t("player.profile.fallbackName")

  if (profile.bot) {
    return <BotProfile profile={profile} name={name} />
  }

  return (
    <PlayerProfileContent profile={profile} playerId={playerId} name={name} />
  )
}

function BotProfile({
  profile,
  name,
}: {
  profile: PlayerProfile
  name: string
}) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <UserAvatar
          name={name}
          userId={profile.userId}
          avatarOptions={profile.avatarOptions ?? undefined}
          size={112}
        />
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          {name}
        </h1>
      </div>
    </PageContainer>
  )
}

function PlayerProfileContent({
  profile,
  playerId,
  name,
}: {
  profile: PlayerProfile
  playerId: string
  name: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const me = getUserId()
  const [salonOpen, setSalonOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportedFor, setReportedFor] = useState<string | null>(null)
  const reportOpen = reportTarget === playerId
  const reported = reportedFor === playerId

  const { toggle: toggleFollow } = useToggleUserFollow(playerId)
  const createChallenge = useCreateChallenge()
  const navigate = useNavigate()
  const presence = usePresence(playerId)
  // Titre **porté** du joueur consulté (libellé composé : palier traduit + nom du sujet) ; repli sur
  // le titre de compte transitoire tant qu'il n'en affiche aucun.
  const titles = usePlayerTitles(playerId)
  const equippedTitle = useEquippedTitle(titles.data)
  const equippedTitleLabel = useEquippedTitleLabel(titles.data)
  const headToHead = useHeadToHead(me ?? "", playerId)
  const commonGames = headToHead.data?.played ?? 0
  const rating = profile.progression.rating ?? 200
  const provisional = profile.progression.provisional ?? true
  const tier = eloTier(rating)

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions ?? undefined,
        }}
        bannerUrl={profile.bannerUrl}
        eloTier={tier}
        titleRibbon={
          equippedTitleLabel && equippedTitle ? (
            <TitleRibbon label={equippedTitleLabel} rank={equippedTitle.tier} />
          ) : undefined
        }
        meta={
          <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
            <EloBadge rating={rating} provisional={provisional} />
            {profile.country ? (
              <span>
                · {countryFlag(profile.country)}{" "}
                {countryLabel(profile.country, locale)}
              </span>
            ) : null}
          </span>
        }
        extra={
          <div className="flex flex-wrap items-center justify-center gap-2 tablet-up:justify-start">
            <PresenceBadge
              online={presence.data?.status === "ONLINE"}
              lastSeenAt={presence.data?.lastSeenAt}
              suspended={profile.suspended}
            />
            {profile.suspended ? <SuspendedBadge /> : null}
          </div>
        }
        actions={
          <>
            <Button
              size="lg"
              className="w-full whitespace-nowrap"
              disabled={profile.suspended}
              onClick={() => setSalonOpen(true)}
            >
              <Swords /> {t("player.profile.challenge")}
            </Button>
            <Button
              variant={profile.following ? "secondary" : "outline"}
              size="lg"
              className="w-full"
              onClick={toggleFollow}
              aria-pressed={profile.following}
              aria-label={
                profile.following
                  ? t("player.profile.unfollowAria")
                  : t("player.profile.followAria")
              }
            >
              {profile.following ? (
                <UserCheck className="text-accent-ink" />
              ) : (
                <UserPlus />
              )}
              {profile.following
                ? t("player.profile.following")
                : t("player.profile.follow")}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={reported}
              onClick={() => setReportTarget(playerId)}
            >
              <Flag />
              {reported
                ? t("moderation.report.reported")
                : t("moderation.report.action")}
            </Button>
          </>
        }
        stats={[
          {
            label: t("player.profile.stats.played"),
            value: profile.stats.played,
          },
          {
            label: t("player.profile.stats.followers"),
            value: profile.followersCount,
          },
          {
            label: t("player.profile.stats.following"),
            value: profile.followingCount,
          },
        ]}
      />

      {/* Bandeau plein comme les onglets du profil / de la fiche sujet : seuls le titre et le
          face-à-face portent `bg-background`, la liste reste sur le fond de page. */}
      <PageHeaderBar>
        <div className="flex w-full flex-col gap-3">
          <h2 className="font-heading text-xl font-extrabold tracking-tight">
            {t("player.profile.versusTitle", { name })}
          </h2>
          {commonGames > 0 && headToHead.data ? (
            <WinLossBar
              wins={headToHead.data.wins}
              draws={headToHead.data.draws}
              losses={headToHead.data.losses}
            />
          ) : null}
        </div>
      </PageHeaderBar>

      <GameHistorySection
        userId={me ?? ""}
        opponentId={playerId}
        showOpponent={false}
        empty={
          <EmptyState
            icon={<Swords className="size-6 text-muted-foreground" />}
            title={t("player.profile.emptyCommonTitle")}
            description={t("player.profile.emptyCommonDescription")}
          >
            <Button
              disabled={profile.suspended}
              onClick={() => setSalonOpen(true)}
            >
              <Swords /> {t("player.profile.challenge")}
            </Button>
          </EmptyState>
        }
      />

      <ThemePickerDialog
        open={salonOpen}
        onClose={() => {
          if (!createChallenge.isPending) setSalonOpen(false)
        }}
        title={t("player.profile.challengeTitle", { name })}
        sub={t("player.profile.challengeSub")}
        pending={createChallenge.isPending}
        onSelect={(topicId) => {
          createChallenge.mutate(
            { topicId, opponentId: profile.userId },
            { onSuccess: () => void navigate("/challenges?type=sent") }
          )
        }}
      />

      <ReportUserDialog
        open={reportOpen}
        onClose={() => setReportTarget(null)}
        targetUserId={profile.userId}
        targetPseudonym={name}
        targetAvatarOptions={profile.avatarOptions}
        onReported={() => setReportedFor(playerId)}
      />
    </>
  )
}
