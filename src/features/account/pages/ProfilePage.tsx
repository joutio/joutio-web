import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  PencilSimpleIcon,
  ShareNetworkIcon,
  SwordIcon,
} from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import {
  StickyHeaderProvider,
  StickyHeaderSlot,
} from "@/shared/components/sticky-header-stack"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import { ProgressBanner } from "@/shared/components/progress-banner"
import { WinLossBar } from "@/shared/components/win-loss-bar"
import { hasWinLossResults } from "@/shared/utils/win-loss"
import {
  GameHistorySection,
  ProfileBanner,
  ProfileShareDialog,
} from "@/features/player"
import {
  BadgeCollectionSection,
  EloBadge,
  TitleRibbon,
  eloProgressPercent,
  eloTier,
  nextEloTier,
  tierKeyOf,
  useBadgeCollection,
  useEquippedTitle,
  useEquippedTitleLabel,
  usePlayerTitles,
  ProfileTitlesSection,
  RewardsSection,
} from "@/features/progression"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { PageContainer, useMe } from "@/features/shell"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import { StreakSection } from "../components/StreakSection"
import { TopicsPlayedSection } from "../components/TopicsPlayedSection"

export function ProfilePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const meQuery = useMe()
  const userId = meQuery.userId
  const [shareOpen, setShareOpen] = useState(false)

  // Titres thématiques : le **titre porté** remplace le titre de compte (transitoire) dans le
  // bandeau, et la collection alimente l'aperçu de badges.
  const titles = usePlayerTitles(userId ?? "")
  const equippedTitle = useEquippedTitle(titles.data)
  const equippedTitleLabel = useEquippedTitleLabel(titles.data)
  const collection = useBadgeCollection(userId ?? "")
  const [tab, setTab] = useUrlParam<string>("tab", "parties")

  if (meQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("shell.profile.loading")}
        </p>
      </PageContainer>
    )
  }

  const profile = meQuery.data
  const name = profile?.pseudonym ?? t("shell.settings.fallbackPlayer")
  const rating = profile?.progression.rating ?? 200
  const provisional = profile?.progression.provisional ?? true
  const tier = eloTier(rating)
  const nextTier = nextEloTier(rating)
  const stats = profile?.stats
  const results = {
    wins: stats?.wins ?? 0,
    draws: stats?.draws ?? 0,
    losses: stats?.losses ?? 0,
  }
  const country = countryLabel(profile?.country, locale)
  // Le titre porté s'affiche en **ruban de son rang** sous les informations : la ligne d'info
  // porte l'Elo global (compétence) et le pays, jamais le niveau de compte.
  const meta = (
    <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
      <EloBadge rating={rating} provisional={provisional} />
      {profile?.country ? (
        <span>
          · {countryFlag(profile.country)} {country}
        </span>
      ) : null}
    </span>
  )

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: userId ?? undefined,
          avatarOptions: profile?.avatarOptions ?? undefined,
        }}
        bannerUrl={profile?.bannerUrl ?? null}
        eloTier={tier}
        onEditAvatar={() => void navigate("/settings/avatar")}
        titleRibbon={
          equippedTitleLabel && equippedTitle ? (
            <TitleRibbon label={equippedTitleLabel} rank={equippedTitle.tier} />
          ) : undefined
        }
        meta={meta}
        stats={[
          { label: t("shell.profile.stats.games"), value: stats?.played ?? 0 },
          {
            label: t("shell.profile.stats.followers"),
            value: profile?.followersCount ?? 0,
          },
          {
            label: t("shell.profile.stats.following"),
            value: profile?.followingCount ?? 0,
          },
        ]}
        aboveStats={
          /* Barre de rang Elo : progression vers le palier suivant, au-dessus des stats. */
          <ProgressBanner
            label={`Elo ${rating} · ${t(tierKeyOf(tier))}`}
            value={eloProgressPercent(rating)}
            detail={
              nextTier
                ? t("progression.eloToNext", {
                    remaining: nextTier.min - rating,
                    tier: t(tierKeyOf(nextTier.rank)),
                  })
                : undefined
            }
          />
        }
        belowStats={
          hasWinLossResults(results) ? <WinLossBar {...results} /> : undefined
        }
        actions={
          <>
            <Button onClick={() => void navigate("/settings")}>
              <PencilSimpleIcon /> {t("shell.profile.edit")}
            </Button>
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <ShareNetworkIcon /> {t("shell.profile.share")}
            </Button>
          </>
        }
      />

      <StickyHeaderProvider>
        <Tabs value={tab} onValueChange={setTab}>
          <PageHeaderBar sticky below={<StickyHeaderSlot />}>
            <TabsList>
              <TabsTrigger value="parties">
                {t("shell.profile.tabs.parties")}
              </TabsTrigger>
              <TabsTrigger value="stats">
                {t("shell.profile.tabs.stats")}
              </TabsTrigger>
              <TabsTrigger value="badges">
                {t("shell.profile.tabs.badges")}
              </TabsTrigger>
              <TabsTrigger value="titres">
                {t("shell.profile.tabs.titles")}
              </TabsTrigger>
              <TabsTrigger value="recompenses">
                {t("shell.profile.tabs.rewards")}
              </TabsTrigger>
            </TabsList>
          </PageHeaderBar>

          <TabsContent value="parties" className="mt-0">
            <GameHistorySection
              userId={userId ?? ""}
              stickyActive={tab === "parties"}
              empty={
                <EmptyState
                  icon={<SwordIcon className="size-6 text-muted-foreground" />}
                  title={t("shell.profile.emptyTitle")}
                  description={t("shell.profile.emptyDescription")}
                >
                  <Button onClick={() => void navigate("/topics")}>
                    <SwordIcon /> {t("shell.profile.findOpponent")}
                  </Button>
                </EmptyState>
              }
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <PageContainer>
              {(stats?.played ?? 0) === 0 ? (
                <EmptyState
                  icon={<SwordIcon className="size-6 text-muted-foreground" />}
                  title={t("shell.profile.emptyTitle")}
                  description={t("shell.profile.emptyDescription")}
                >
                  <Button onClick={() => void navigate("/topics")}>
                    <SwordIcon /> {t("shell.profile.findOpponent")}
                  </Button>
                </EmptyState>
              ) : (
                <>
                  <StreakSection userId={userId ?? ""} />
                  <TopicsPlayedSection userId={userId ?? ""} />
                </>
              )}
            </PageContainer>
          </TabsContent>

          <TabsContent value="badges" className="mt-0">
            <BadgeCollectionSection
              collection={collection.data}
              stickyActive={tab === "badges"}
            />
          </TabsContent>

          <TabsContent value="titres" className="mt-0">
            <ProfileTitlesSection
              userId={userId ?? ""}
              titles={titles.data}
              isLoading={titles.isLoading}
              stickyActive={tab === "titres"}
            />
          </TabsContent>

          <TabsContent value="recompenses" className="mt-0">
            <PageContainer>
              <RewardsSection />
            </PageContainer>
          </TabsContent>
        </Tabs>
      </StickyHeaderProvider>

      {userId && (
        <ProfileShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          userId={userId}
          name={name}
        />
      )}
    </>
  )
}
