import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/shared/components/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import { PageContainer, useMe } from "@/features/shell"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import type { TranslationKey } from "@/lib/i18n/types"
import { PersonTile, usePeople } from "@/features/follows"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import type {
  PeopleDirection,
  PeopleSort,
  PlayerCard,
} from "@/features/player/domain/profile"
import {
  mergePeopleCards,
  sortPeopleCards,
  togglePeopleDirection,
} from "../domain/people-directory"

const SORTS: { value: PeopleSort; labelKey: TranslationKey }[] = [
  { value: "ELO", labelKey: "social.sorts.elo" },
  { value: "RECENT", labelKey: "social.sorts.recent" },
  { value: "ALPHA", labelKey: "social.sorts.alpha" },
]

interface PeopleDirectoryProps {
  directions: PeopleDirection[]
  onDirectionsChange: (directions: PeopleDirection[]) => void
}

/**
 * Annuaire **Social** : abonnements / abonnés, avec recherche, tri et grille de tuiles. Les
 * directions sont des **filtres** de la barre de recherche — des puces sur desktop, une section
 * dédiée dans la bottom sheet en tactile — et restent persistées dans l'URL. Quand les deux sont
 * actives, la grille affiche leur **union dédupliquée**.
 */
export function PeopleDirectory({
  directions,
  onDirectionsChange,
}: PeopleDirectoryProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useMe()
  const [query, setQuery] = useUrlParam<string>("q", "")
  const [sort, setSort] = useUrlParam<PeopleSort>("sort", "RECENT")
  const updateParams = useUrlParams()
  const debounced = useDebounce(query, 250)

  const followingSelected = directions.includes("following")
  const followersSelected = directions.includes("followers")
  const params = useMemo(
    () => ({ q: debounced, sort, page: 0, size: 100 }),
    [debounced, sort]
  )
  const following = usePeople("following", params, followingSelected)
  const followers = usePeople("followers", params, followersSelected)

  const people = useMemo(() => {
    const lists: PlayerCard[][] = []
    if (followingSelected) lists.push(following.data?.content ?? [])
    if (followersSelected) lists.push(followers.data?.content ?? [])
    return sortPeopleCards(mergePeopleCards(lists), sort)
  }, [
    followers.data,
    following.data,
    followersSelected,
    followingSelected,
    sort,
  ])

  const bothSelected = followingSelected && followersSelected
  const total = bothSelected
    ? people.length
    : ((followingSelected
        ? following.data?.totalElements
        : followers.data?.totalElements) ?? 0)
  const isError =
    (!followingSelected || following.isError) &&
    (!followersSelected || followers.isError)
  const isLoading =
    (followingSelected && following.isLoading) ||
    (followersSelected && followers.isLoading)

  const retry = () => {
    if (followingSelected) void following.refetch()
    if (followersSelected) void followers.refetch()
  }

  const sortOptions = SORTS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const directionOptions: { value: PeopleDirection; label: string }[] = [
    {
      value: "following",
      label: t("social.people.following", {
        count: me.data?.followingCount ?? 0,
      }),
    },
    {
      value: "followers",
      label: t("social.people.followers", {
        count: me.data?.followersCount ?? 0,
      }),
    },
  ]
  const directionLabel = bothSelected
    ? t("social.people.summaryBoth")
    : (directionOptions.find((option) => option.value === directions[0])
        ?.label ?? "")
  const activeCount =
    (query ? 1 : 0) +
    (sort === "RECENT" ? 0 : 1) +
    (directions.length === 1 && directions[0] === "following" ? 0 : 1)

  const toggleDirection = (direction: PeopleDirection) =>
    onDirectionsChange(togglePeopleDirection(directions, direction))

  const clearFilters = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("sort")
      params.delete("tab")
    })

  return (
    <>
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t("social.searchPlaceholder")}
        leading={
          <>
            {directionOptions.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="sm"
                pressed={directions.includes(option.value)}
                onPressedChange={() => toggleDirection(option.value)}
              >
                {option.label}
              </Toggle>
            ))}
          </>
        }
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PeopleSort)}
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label={t("social.sortAria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        filters={
          <FilterSections defaultOpen="direction">
            <FilterSection
              value="direction"
              title={t("social.people.filterTitle")}
              summary={directionLabel}
            >
              {directionOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={directions.includes(option.value)}
                  onSelect={() => toggleDirection(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
            <FilterSection
              value="sort"
              title={t("social.sortSection")}
              summary={
                sortOptions.find((option) => option.value === sort)?.label
              }
            >
              {sortOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={sort === option.value}
                  onSelect={() => setSort(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
          </FilterSections>
        }
        activeCount={activeCount}
        onClear={clearFilters}
        count={total}
        countLabel={t("social.countLabel")}
      />

      <PageContainer>
        {isError ? (
          <EmptyState title={t("social.error")}>
            <Button variant="outline" onClick={retry}>
              {t("social.retry")}
            </Button>
          </EmptyState>
        ) : isLoading && people.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : people.length === 0 ? (
          <EmptyState
            icon={<UserRound className="size-6 text-muted-foreground" />}
            title={
              bothSelected
                ? t("social.emptyBoth")
                : directions[0] === "following"
                  ? t("social.emptyFollowing")
                  : t("social.emptyFollowers")
            }
            description={t("social.emptyDescription")}
          >
            <Button variant="outline" onClick={() => void navigate("/topics")}>
              {t("social.exploreTopics")}
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 tablet-up:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] tablet-up:gap-3">
            {people.map((person) => (
              <PersonTile
                key={person.userId}
                person={person}
                onOpen={(userId) => void navigate(`/players/${userId}`)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
