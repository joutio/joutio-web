import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  GlobeHemisphereWestIcon,
  MapPinIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "@phosphor-icons/react"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BottomSheet,
  BottomSheetClose,
} from "@/components/arc/bottom-sheet/bottom-sheet"
import { Toggle } from "@/components/ui/toggle"
import { LeaderboardCard } from "@/components/ui/leaderboard-card"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { StickyHeaderFilters } from "@/shared/components/sticky-header-stack"
import { PageContainer } from "@/features/shell"
import { getSessionUserId as getUserId } from "@/features/auth"
import { useLocale } from "@/lib/i18n/useLocale"
import type { TranslationKey } from "@/lib/i18n/types"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import { useScrollContainer } from "@/shared/hooks/useScrollContainer"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { countryLabel } from "@/shared/utils/country"
import type { LeaderboardPeriod, LeaderboardScope } from "@/features/topics"
import { useTopicLeaderboard } from "../hooks/useTopicDetail"

const PERIODS: { value: LeaderboardPeriod; labelKey: TranslationKey }[] = [
  { value: "ALL_TIME", labelKey: "topic.leaderboard.period.allTime" },
  { value: "MONTHLY", labelKey: "topic.leaderboard.period.monthly" },
]

const SCOPES: {
  value: LeaderboardScope
  labelKey: TranslationKey
  icon: typeof GlobeHemisphereWestIcon
}[] = [
  { value: "WORLD", labelKey: "topic.leaderboard.scope.world", icon: GlobeHemisphereWestIcon },
  {
    value: "FOLLOWING",
    labelKey: "topic.leaderboard.scope.following",
    icon: UsersIcon,
  },
  {
    value: "COUNTRY",
    labelKey: "topic.leaderboard.scope.country",
    icon: MapPinIcon,
  },
]

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** Les 12 derniers mois (mois courant inclus), du plus récent au plus ancien. */
function lastTwelveMonths(
  format: Intl.DateTimeFormat
): { value: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    return { value: monthKey(date), label: format.format(date) }
  })
}

/**
 * Classement d'un sujet — filtres en **bande pleine largeur** (comme `SearchToolbar` sur la
 * page Personnes), puis contenu dans un `PageContainer`. Design Trophy (`LeaderboardCard`).
 */
interface TopicLeaderboardProps {
  topicId: string
  /** L'onglet est actif : sa barre de filtres compacte peut rejoindre le header sticky partagé. */
  stickyActive?: boolean
}

export function TopicLeaderboard({
  topicId,
  stickyActive = true,
}: TopicLeaderboardProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [period, setPeriod] = useUrlParam<LeaderboardPeriod>(
    "period",
    "ALL_TIME"
  )
  const [scope, setScope] = useUrlParam<LeaderboardScope>("scope", "WORLD")
  const [month, setMonth] = useUrlParam("month", monthKey(new Date()))
  const userId = getUserId()
  const navigate = useNavigate()
  const scrollContainer = useScrollContainer()
  const leaderboard = useTopicLeaderboard(topicId, {
    period,
    scope,
    month: period === "MONTHLY" ? month : undefined,
  })
  const { isLoading, isError } = leaderboard

  const periodOptions = useMemo(
    () => PERIODS.map((option) => ({ ...option, label: t(option.labelKey) })),
    [t]
  )
  const scopeOptions = useMemo(
    () => SCOPES.map((option) => ({ ...option, label: t(option.labelKey) })),
    [t]
  )

  // Pagination serveur : les pages chargées au défilement sont fusionnées en une seule liste.
  const entries = useMemo(
    () => leaderboard.data?.pages.flatMap((page) => page.entries.content) ?? [],
    [leaderboard.data]
  )
  const sentinelRef = useLoadMoreOnIntersect({
    enabled: leaderboard.hasNextPage && !leaderboard.isFetchingNextPage,
    onLoadMore: () => void leaderboard.fetchNextPage(),
    rootRef: scrollContainer,
  })

  const scopeLabel =
    scopeOptions.find((s) => s.value === scope)?.label ??
    t("topic.leaderboard.scope.world")
  const periodLabel =
    period === "MONTHLY"
      ? t("topic.leaderboard.periodCaption.monthly")
      : t("topic.leaderboard.periodCaption.allTime")

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale]
  )
  const months = useMemo(() => lastTwelveMonths(monthFormat), [monthFormat])
  const selectedMonthLabel =
    months.find((m) => m.value === month)?.label ??
    monthFormat.format(new Date())
  const [year, monthNumber] = month.split("-").map(Number)
  const monthStart = new Date(year, monthNumber - 1, 1)
  const monthEnd = new Date(year, monthNumber, 0)
  const subtitle =
    period === "MONTHLY"
      ? `${selectedMonthLabel} · ${scopeLabel}`
      : `${scopeLabel} · ${t("topic.leaderboard.periodCaption.allTime")}`

  const rankings = entries.map((entry) => ({
    userId: entry.userId,
    userName: entry.pseudonym ?? t("topic.leaderboard.playerFallback"),
    rank: entry.rank,
    value: period === "MONTHLY" ? entry.monthlyXp : entry.totalXp,
    avatarOptions: entry.avatarOptions,
    rating: entry.rating,
    provisional: entry.provisional,
    byline: `${t("topic.leaderboard.elo", { rating: entry.rating ?? 200 })}${
      entry.country ? ` · ${countryLabel(entry.country, locale)}` : ""
    }${entry.suspended ? ` · ${t("moderation.suspendedBadge")}` : ""}`,
  }))
  const podiumRankings = rankings.slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* Tactile : résumé + drawer de filtres (le classement garde un maximum d'espace). */}
      <StickyHeaderFilters active={stickyActive}>
        {(stacked) => (
          <div
            data-slot="topic-leaderboard-toolbar"
            className={cn(
              "desktop:hidden",
              !stacked &&
                "qu-scroll-chrome qu-sticky-follow sticky top-[calc(var(--qu-topbar-offset,0rem)_+_var(--qu-chrome-shift,0px))] z-10 border-b"
            )}
          >
            <div className="flex items-center gap-2 px-(--page-gutter-x) py-2.5">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
              <BottomSheet
                title={t("topic.leaderboard.filtersTitle")}
                description={subtitle}
                detents={SHEET_DETENTS.leaderboard}
                trigger={
                  <button
                    type="button"
                    aria-label={t("topic.leaderboard.filtersTitle")}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "shrink-0"
                    )}
                  >
                    <SlidersHorizontalIcon className="size-4" />
                  </button>
                }
                footer={
                  <BottomSheetClose asChild>
                    <button
                      type="button"
                      className={cn(buttonVariants(), "w-full")}
                    >
                      {t("topic.leaderboard.view")}
                    </button>
                  </BottomSheetClose>
                }
              >
                <FilterSections defaultOpen="period">
                  <FilterSection
                    value="period"
                    title={t("topic.leaderboard.periodTitle")}
                    summary={
                      periodOptions.find((option) => option.value === period)
                        ?.label
                    }
                  >
                    {periodOptions.map((option) => (
                      <FilterOption
                        key={option.value}
                        selected={period === option.value}
                        onSelect={() => setPeriod(option.value)}
                      >
                        {option.label}
                      </FilterOption>
                    ))}
                  </FilterSection>

                  {period === "MONTHLY" && (
                    <FilterSection
                      value="month"
                      title={t("topic.leaderboard.monthTitle")}
                      summary={selectedMonthLabel}
                    >
                      {months.map((option) => (
                        <FilterOption
                          key={option.value}
                          selected={month === option.value}
                          onSelect={() => setMonth(option.value)}
                        >
                          {option.label}
                        </FilterOption>
                      ))}
                    </FilterSection>
                  )}

                  <FilterSection
                    value="scope"
                    title={t("topic.leaderboard.scopeTitle")}
                    summary={scopeLabel}
                  >
                    {scopeOptions.map((option) => (
                      <FilterOption
                        key={option.value}
                        selected={scope === option.value}
                        onSelect={() => setScope(option.value)}
                      >
                        <option.icon className="size-4" /> {option.label}
                      </FilterOption>
                    ))}
                  </FilterSection>
                </FilterSections>
              </BottomSheet>
            </div>
          </div>
        )}
      </StickyHeaderFilters>

      {/* Desktop : bande de filtres pleine largeur, sous la topbar. */}
      <div className="hidden border-b bg-background desktop:block">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-2.5 px-(--page-gutter-x) py-3">
          <div className="flex items-center gap-1.5">
            {periodOptions.map((p) => (
              <Toggle
                key={p.value}
                variant="outline"
                size="sm"
                pressed={period === p.value}
                onPressedChange={() => setPeriod(p.value)}
              >
                {p.label}
              </Toggle>
            ))}
          </div>
          {period === "MONTHLY" && (
            <Select
              value={month}
              onValueChange={(value) => {
                if (value) {
                  setMonth(value)
                }
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-[170px]"
                aria-label={t("topic.leaderboard.monthAria")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            {scopeOptions.map((s) => (
              <Toggle
                key={s.value}
                variant="outline"
                size="sm"
                pressed={scope === s.value}
                onPressedChange={() => setScope(s.value)}
              >
                <s.icon /> {s.label}
              </Toggle>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {scopeLabel} · {periodLabel}
          </span>
        </div>
      </div>

      <PageContainer style={{ paddingTop: 16 }}>
        {isLoading ? (
          <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
            {t("topic.leaderboard.loading")}
          </Card>
        ) : isError ? (
          <Card size="sm" className="px-4 py-6 text-sm text-destructive">
            {t("topic.leaderboard.error")}
          </Card>
        ) : rankings.length === 0 ? (
          <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
            {t("topic.leaderboard.empty")}
          </Card>
        ) : (
          <>
            <LeaderboardCard
              title={t("topic.leaderboard.title")}
              subtitle={subtitle}
              fromDate={period === "MONTHLY" ? monthStart : new Date()}
              toDate={period === "MONTHLY" ? monthEnd : new Date()}
              podiumRankings={podiumRankings}
              rankings={rankings}
              currentUserId={userId ?? undefined}
              onUserClick={(ranking) =>
                void navigate(`/players/${ranking.userId}`)
              }
              showPagination={false}
            />

            {leaderboard.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {leaderboard.isFetchingNextPage && (
              <div className="mt-3 h-16 animate-pulse rounded-2xl bg-muted/50" />
            )}
          </>
        )}
      </PageContainer>
    </div>
  )
}
