import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Plus, SquarePen } from "lucide-react"
import type { TranslationKey } from "@/lib/i18n/types"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { FacetCombobox } from "../components/facet-combobox"
import { FacetOptionList } from "../components/facet-option-list"
import { Toggle } from "@/components/ui/toggle"
import { PageContainer, useTopicGridStore } from "@/features/shell"
import { categoryColor } from "@/shared/utils/categories"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import { usePreloadImages } from "@/shared/hooks/usePreloadImages"
import { useScrollContainer } from "@/shared/hooks/useScrollContainer"
import {
  useUrlParam,
  useUrlParamBool,
  useUrlParams,
} from "@/shared/hooks/useUrlParam"
import { useFeatureFlag } from "@/shared/hooks/use-feature-flag"
import { TopicGrid } from "../components/TopicGrid"
import { topicGridClass } from "../domain/topic-grid"
import type { TopicSort } from "../domain/topic"
import { useTopicFacets, useTopicsList } from "../hooks/useTopics"

const SKELETON_COUNT = 6

const TOPIC_SORTS: { value: TopicSort; labelKey: TranslationKey }[] = [
  { value: "POPULAR", labelKey: "topics.sorts.popular" },
  { value: "MOST_PLAYED", labelKey: "topics.sorts.mostPlayed" },
  { value: "ALPHA", labelKey: "topics.sorts.alpha" },
  { value: "RECENT", labelKey: "topics.sorts.recent" },
]

/**
 * Catalogue Sujets : recherche et filtres **persistés dans l'URL** (`?q=&category=&sort=&followed=`)
 * — un retour depuis une fiche sujet restaure exactement la même vue, et le lien est partageable.
 * L'atelier d'auteur est un **filtre** (`?mine=true`, comme « Suivis ») avec un bouton
 * « Créer un sujet » : `mine` étant exclusif des autres filtres côté BFF, activer un autre
 * filtre (ou saisir une recherche) quitte « Mes sujets ».
 */
export function TopicsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [q] = useUrlParam<string>("q", "")
  const [category] = useUrlParam<string>("category", "")
  const [sort] = useUrlParam<TopicSort>("sort", "POPULAR")
  const [followedOnly] = useUrlParamBool("followed", false)
  const [mineParam, setMine] = useUrlParamBool("mine", false)
  const topicAuthoring = useFeatureFlag("topicAuthoring")
  // Atelier coupé pour les joueurs : « Mes sujets » est ignoré, même via une URL directe
  // (`?mine=true`). Les administrateurs disposent de l'accès anticipé.
  const mine = topicAuthoring && mineParam
  const updateParams = useUrlParams()
  const scrollContainer = useScrollContainer()
  const canObserve = typeof IntersectionObserver !== "undefined"
  const topicColumns = useTopicGridStore((state) => state.columns)

  const debouncedQuery = useDebounce(q, 300)

  const sortOptions = useMemo(
    () =>
      TOPIC_SORTS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  )

  const query = useTopicsList(
    mine
      ? { mine: true }
      : {
          q: debouncedQuery,
          category: category || undefined,
          sort,
          followed: followedOnly,
        }
  )

  const facets = useTopicFacets({
    q: debouncedQuery,
    followed: followedOnly,
  })

  const facetList = useMemo(
    () =>
      (facets.data?.categories ?? []).map((facet) => ({
        value: facet.category,
        label: facet.label,
        count: facet.count,
        color: categoryColor(facet.category),
      })),
    [facets.data]
  )

  const topics = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data]
  )
  const total = query.data?.pages[0]?.totalElements ?? 0
  const activeCount =
    (q ? 1 : 0) + (category ? 1 : 0) + (followedOnly ? 1 : 0) + (mine ? 1 : 0)

  const reset = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("category")
      params.delete("sort")
      params.delete("followed")
      params.delete("mine")
    })

  /** `mine` est exclusif côté BFF : l'activer repart d'un état de filtres vierge. */
  const activateMine = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("category")
      params.delete("sort")
      params.delete("followed")
      params.set("mine", "true")
    })

  const toggleMine = (next: boolean) => {
    if (next) activateMine()
    else setMine(false)
  }

  /**
   * `mine` est exclusif côté BFF : toute utilisation d'un autre filtre (ou de la recherche)
   * quitte « Mes sujets » dans **une seule navigation atomique** — deux `setSearchParams`
   * successifs partageraient la même base de render et le second écraserait le premier.
   */
  const applyFilter = (mutate: (params: URLSearchParams) => void) =>
    updateParams((params) => {
      params.delete("mine")
      mutate(params)
    })

  const setQuery = (value: string) =>
    applyFilter((params) => {
      if (value) params.set("q", value)
      else params.delete("q")
    })

  const setCategoryFilter = (value: string | null) =>
    applyFilter((params) => {
      if (value) params.set("category", value)
      else params.delete("category")
    })

  const toggleFollowed = () =>
    applyFilter((params) => {
      if (!followedOnly) params.set("followed", "true")
      else params.delete("followed")
    })

  const setSortFilter = (value: TopicSort) =>
    applyFilter((params) => {
      if (value === "POPULAR") params.delete("sort")
      else params.set("sort", value)
    })

  const sentinelRef = useLoadMoreOnIntersect({
    enabled: query.hasNextPage && !query.isFetchingNextPage,
    onLoadMore: () => void query.fetchNextPage(),
    rootRef: scrollContainer,
  })

  // Précharge les premiers visuels de la grille (priorité basse, le reste en lazy).
  const preloadUrls = useMemo(
    () => topics.map((topic) => topic.imageUrl),
    [topics]
  )
  usePreloadImages(preloadUrls, { limit: 8, priority: "low" })

  const listClassName = topicGridClass(topicColumns)

  const mobileFilters = (
    <FilterSections defaultOpen="sort">
      <FilterSection
        value="source"
        title={t("topics.filters.title")}
        summary={
          mine
            ? t("topics.list.mineToggle")
            : followedOnly
              ? t("topics.filters.sourceFollowed")
              : t("topics.filters.sourceAll")
        }
      >
        <FilterOption
          selected={followedOnly && !mine}
          onSelect={toggleFollowed}
        >
          <Heart className="size-4" /> {t("topics.filters.sourceFollowed")}
        </FilterOption>
        {topicAuthoring && (
          <FilterOption selected={mine} onSelect={() => toggleMine(!mine)}>
            <SquarePen className="size-4" /> {t("topics.list.mineToggle")}
          </FilterOption>
        )}
      </FilterSection>

      <FilterSection
        value="category"
        title={t("topics.filters.category")}
        summary={
          facetList.find((facet) => facet.value === category)?.label ??
          t("topics.filters.all")
        }
      >
        <FacetOptionList
          options={facetList}
          value={category || null}
          onChange={setCategoryFilter}
        />
      </FilterSection>

      <FilterSection
        value="sort"
        title={t("topics.filters.sort")}
        summary={sortOptions.find((option) => option.value === sort)?.label}
      >
        {sortOptions.map((option) => (
          <FilterOption
            key={option.value}
            selected={sort === option.value}
            onSelect={() => setSortFilter(option.value)}
          >
            {option.label}
          </FilterOption>
        ))}
      </FilterSection>
    </FilterSections>
  )

  return (
    <>
      {/* Barre d'en-tête rendue uniquement avec l'atelier : sans lui, elle serait vide entre
          la topbar et les filtres (le bouton compact flottant reste, lui, conditionné plus bas). */}
      {topicAuthoring && (
        <PageHeaderBar className="compact:hidden">
          <Button
            className="ml-auto hidden tablet-up:inline-flex"
            nativeButton={false}
            render={<Link to="/topics/new" />}
          >
            <Plus /> {t("topics.list.create")}
          </Button>
        </PageHeaderBar>
      )}

      <SearchToolbar
        query={q}
        onQueryChange={setQuery}
        placeholder={t("topics.list.searchPlaceholder")}
        leading={
          <>
            <Toggle
              variant="outline"
              size="sm"
              pressed={followedOnly && !mine}
              onPressedChange={toggleFollowed}
            >
              <Heart /> {t("topics.list.followedToggle")}
            </Toggle>
            {topicAuthoring && (
              <Toggle
                variant="outline"
                size="sm"
                pressed={mine}
                onPressedChange={() => toggleMine(!mine)}
              >
                <SquarePen /> {t("topics.list.mineToggle")}
              </Toggle>
            )}
          </>
        }
        controls={
          <>
            <FacetCombobox
              label={t("topics.filters.category")}
              options={facetList}
              value={category || null}
              onChange={setCategoryFilter}
            />
            <Select
              value={sort}
              onValueChange={(value) => setSortFilter(value as TopicSort)}
            >
              <SelectTrigger
                size="sm"
                className="w-[190px]"
                aria-label={t("topics.list.sortAria")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        filters={mobileFilters}
        activeCount={activeCount}
        onClear={reset}
        count={total}
        countLabel={t("topics.list.countLabel")}
      />

      <PageContainer>
        {query.isLoading ? (
          <div className={listClassName}>
            {Array.from({ length: 12 }).map((_, i) => (
              <TopicTileSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState
            title={mine ? t("topics.list.errorMine") : t("topics.list.error")}
          >
            <Button variant="outline" onClick={() => void query.refetch()}>
              {t("topics.list.retry")}
            </Button>
          </EmptyState>
        ) : total === 0 ? (
          <EmptyState
            title={t("topics.list.emptyTitle")}
            description={
              mine ? t("topics.list.emptyMine") : t("topics.list.empty")
            }
          >
            {mine ? (
              <Button nativeButton={false} render={<Link to="/topics/new" />}>
                <Plus /> {t("topics.list.create")}
              </Button>
            ) : (
              <Button variant="outline" onClick={reset}>
                {t("topics.list.resetFilters")}
              </Button>
            )}
          </EmptyState>
        ) : (
          <>
            <TopicGrid
              topics={topics}
              onOpen={(id) => void navigate(`/topics/${id}`)}
              showStatus={mine}
            />

            {query.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {query.isFetchingNextPage && (
              <div className={`mt-4 ${listClassName}`}>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <TopicTileSkeleton key={i} />
                ))}
              </div>
            )}

            {!canObserve && query.hasNextPage && (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void query.fetchNextPage()}
                >
                  {t("topics.list.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>

      {/* Mobile : l'action de l'en-tête devient un bouton flottant au-dessus de la nav basse
          (bord haut de la nav, quel que soit l'habillage flottant/fixe). */}
      {topicAuthoring && (
        <Button
          aria-label={t("topics.list.create")}
          nativeButton={false}
          render={<Link to="/topics/new" />}
          className="fixed right-(--page-gutter-x) bottom-[calc(var(--bottom-nav-top)+0.75rem)] z-40 hidden size-14 rounded-full shadow-lg shadow-primary/25 compact:inline-flex"
        >
          <Plus className="size-6" />
        </Button>
      )}
    </>
  )
}

/** Skeleton de tuile springboard : carré visuel fluide + deux lignes de nom réservées. */
function TopicTileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 p-1.5">
      <div className="aspect-square w-full animate-pulse rounded-[22%] bg-muted/50" />
      <div className="flex min-h-8 w-full flex-col items-center gap-1">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted/50" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted/50" />
      </div>
    </div>
  )
}
