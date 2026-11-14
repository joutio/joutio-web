import type { TopicSort } from '@joutio/client-domain/api-types'
import { ArrowsDownUpIcon, BellIcon, HeartIcon, MagnifyingGlassIcon, PencilSimpleIcon, SlidersHorizontalIcon, SquaresFourIcon, WarningCircleIcon, type Icon } from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnreadCount } from '@/features/notifications'
import { SettingsButton } from '@/features/settings'
import { TabNav } from '@/features/shell'
import { useT, type MessageKey } from '@/lib/i18n'
import { feedFooterProps } from '@/shared/paging'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { useDebounced } from '@/shared/use-debounced'
import { useStickyAnchor } from '@/shared/use-sticky-anchor'
import {
  Button,
  Chip,
  EmptyState,
  FeedFooter,
  IconButton,
  ListRow,
  MobileSheet,
  MobileTopBar,
  RadioGroup,
  Screen,
  SearchField,
  SectionHeader,
  Skeleton,
  TopicTile,
  tokens,
  type CategoryCode,
} from '@/ui'
import { useTopicFacets, useTopics } from '../hooks/use-topics'
import { DEFAULT_TOPIC_SORT, pageSizeFor, type TopicScope } from '../lib/topics-service'

const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]

/** « Les plus suivis » = `POPULAR`, « Les plus joués » = `MOST_PLAYED`, « Nouveautés » = `RECENT` (`sujets.md` § 5). */
const SORTS: readonly { value: TopicSort; label: MessageKey }[] = [
  { value: 'POPULAR', label: 'topics.sortPopular' },
  { value: 'MOST_PLAYED', label: 'topics.sortPlayed' },
  { value: 'RECENT', label: 'topics.sortRecent' },
]

/** « Mes thèmes » (`sujets.md` § 2, 2026-11-13) : remplace « Masquer les sujets suivis ». */
const SCOPES: readonly { value: TopicScope; label: MessageKey; icon: Icon }[] = [
  { value: 'ALL', label: 'topics.scopeAll', icon: SquaresFourIcon },
  { value: 'FOLLOWED', label: 'topics.scopeFollowed', icon: HeartIcon },
  { value: 'MINE', label: 'topics.scopeMine', icon: PencilSimpleIcon },
]

const toggle = (list: CategoryCode[], category: CategoryCode) => (list.includes(category) ? list.filter((item) => item !== category) : [...list, category])

type FiltersProps = {
  selected: CategoryCode[]
  onSelected: (selected: CategoryCode[]) => void
  sort: TopicSort
  onSort: (sort: TopicSort) => void
  scope: TopicScope
  onScope: (scope: TopicScope) => void
}

/** Univers, tri et sujets suivis : contenu de la feuille Filtres. */
function TopicFiltersForm({ selected, onSelected, sort, onSort, scope, onScope }: FiltersProps) {
  const t = useT()
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <SectionHeader title={t('topics.universes')} />
        <div className="flex flex-wrap gap-2">
          {UNIVERSES.map((category) => (
            <Chip key={category} selected={selected.includes(category)} onClick={() => onSelected(toggle(selected, category))}>
              {tokens.category[category].label}
            </Chip>
          ))}
        </div>
      </section>
      <section className="grid gap-3">
        <SectionHeader title={t('topics.sortBy')} />
        <RadioGroup label={t('topics.sortBy')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
          {SORTS.map((option, index) => (
            <ListRow key={option.value} label={t(option.label)} control="radio" on={sort === option.value} onToggle={() => onSort(option.value)} last={index === SORTS.length - 1} />
          ))}
        </RadioGroup>
      </section>
      <section className="grid gap-3">
        <SectionHeader title={t('topics.scope')} />
        <RadioGroup label={t('topics.scope')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
          {SCOPES.map((option, index) => (
            <ListRow
              key={option.value}
              icon={option.icon}
              label={t(option.label)}
              control="radio"
              on={scope === option.value}
              onToggle={() => onScope(option.value)}
              last={index === SCOPES.length - 1}
            />
          ))}
        </RadioGroup>
      </section>
    </div>
  )
}

/**
 * Grille adaptative de `TopicTile` (`sujets.md`, 2026-11-12) : colonnes d'au moins 96 px, autant que la largeur en
 * permet — 3 sur téléphone, 5 dans la colonne de 626 px de `WebFrame` —, la place restante répartie entre elles.
 */
const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-x-[var(--jo-space-4)] gap-y-[var(--jo-space-5)] px-4'
/** Mêmes valeurs que `GRID` : gouttières 16 px, écart 12 px, colonne de 96 px au moins. */
const columnsFor = (width: number) => Math.max(1, Math.floor((width - 32 + 12) / (96 + 12)))

/** Colonnes que la grille posera, déduites de la largeur du conteneur avant le premier affichage puis à chaque redimensionnement. */
function useGridColumns(container: RefObject<HTMLElement | null>, fallback = 3) {
  const [columns, setColumns] = useState(fallback)
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const measure = () => setColumns(columnsFor(element.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [container])
  return columns
}

function Loading({ columns }: { columns: number }) {
  const t = useT()
  return (
    <div className={`${GRID} pb-6`} aria-label={t('home.loading')}>
      {Array.from({ length: columns * 3 }, (_, index) => (
        <div key={index} className="grid justify-items-center gap-[var(--jo-space-3)]">
          <Skeleton shape="card" className="size-[var(--jo-space-11)] rounded-jo-md" />
          <div className="grid w-full gap-1">
            <Skeleton />
            <Skeleton width="70%" className="justify-self-center" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Sujets (`design/specs/screens/sujets.md`, lab `/screens/sujets?view=compact`) : barre fixe avec recherche et
 * Filtres, puces d'univers, compteur et tri, grille adaptative de `TopicTile` paginée en rangées pleines (environ 20
 * sujets, `size` multiple du nombre de colonnes). Un changement de largeur qui change les colonnes repart de la
 * première page : la pagination du BFF est indexée par page.
 */
export function TopicsPage() {
  const t = useT()
  const navigate = useNavigate()
  const unread = useUnreadCount().data?.count ?? 0
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const [selected, setSelected] = useState<CategoryCode[]>([])
  const [sort, setSort] = useState<TopicSort>(DEFAULT_TOPIC_SORT)
  const [scope, setScope] = useState<TopicScope>('ALL')
  const [sheetOpen, setSheetOpen] = useState(false)
  const { anchor, toThreshold, toTop } = useStickyAnchor()

  useEffect(toThreshold, [search, selected, sort, scope, toThreshold])

  const container = useRef<HTMLDivElement>(null)
  const columns = useGridColumns(container)
  const list = useTopics({ query: search, categories: selected, sort, followed: scope === 'FOLLOWED', mine: scope === 'MINE', size: pageSizeFor(columns) })
  const facets = useTopicFacets(search, scope)
  const topics = list.data?.pages.flatMap((page) => page.topics) ?? []
  const count = facets.data
    ? selected.length === 0
      ? facets.data.total
      : facets.data.categories.filter((facet) => selected.includes(toCategoryCode(facet.category))).reduce((sum, facet) => sum + facet.count, 0)
    : 0
  const quick = [...new Set((facets.data?.categories ?? []).filter((facet) => facet.count > 0).map((facet) => toCategoryCode(facet.category)))]
  const countLabel = (value: number) => t(value > 1 ? 'topics.countMany' : 'topics.countOne', { count: value })
  const sortLabel = t(SORTS.find((option) => option.value === sort)?.label ?? 'topics.sortPopular')
  const empty = list.isSuccess && topics.length === 0
  const reset = () => {
    setSelected([])
    setSort(DEFAULT_TOPIC_SORT)
    setScope('ALL')
  }

  return (
    <Screen
      header={
        <>
          <MobileTopBar
            title={t('nav.topics')}
            right={
              <>
                <IconButton
                  icon={BellIcon}
                  label={t('home.notifications')}
                  variant="plain"
                  tone="neutral"
                  badge={unread > 0 ? 'dot' : undefined}
                  onClick={() => void navigate(ROUTES.notifications)}
                />
                <SettingsButton from="topics" />
              </>
            }
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2">
            <SearchField value={query} onChange={setQuery} placeholder={t('topics.search')} label={t('topics.search')} />
            <IconButton
              icon={SlidersHorizontalIcon}
              label={t('topics.filters')}
              variant="gray"
              tone="neutral"
              badge={selected.length + (scope === 'ALL' ? 0 : 1) || undefined}
              onClick={() => setSheetOpen(true)}
            />
          </div>
        </>
      }
      bottomNav={<TabNav active="topics" onReselect={toTop} />}
      overlay={
        <MobileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t('topics.filters')}
          footer={
            <Button full onClick={() => setSheetOpen(false)}>
              {t('topics.show', { count: countLabel(count) })}
            </Button>
          }
          action={
            <Button variant="plain" size="S" onClick={reset}>
              {t('topics.reset')}
            </Button>
          }
        >
          <TopicFiltersForm selected={selected} onSelected={setSelected} sort={sort} onSort={setSort} scope={scope} onScope={setScope} />
        </MobileSheet>
      }
    >
      <div ref={container} className="flex min-h-full flex-col">
        <div ref={anchor} />
        <div className="jo-no-scrollbar flex flex-none gap-2 overflow-x-auto px-4">
          <Chip selected={selected.length === 0} className="flex-none" onClick={() => setSelected([])}>
            {t('home.all')}
          </Chip>
          {quick.map((category) => (
            <Chip key={category} selected={selected.includes(category)} className="flex-none" onClick={() => setSelected(toggle(selected, category))}>
              {tokens.category[category].label}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-3">
          <span className="jo-type-callout text-jo-muted">{countLabel(list.isError || empty ? 0 : count)}</span>
          <Chip icon={ArrowsDownUpIcon} className="flex-none" onClick={() => setSheetOpen(true)}>
            {sortLabel}
          </Chip>
        </div>
        {list.isPending && <Loading columns={columns} />}
        {list.isError && !list.data && (
          <EmptyState
            className="flex-1"
            icon={WarningCircleIcon}
            title={t('topics.errorTitle')}
            description={t('home.errorText')}
            action={
              <Button loading={list.isRefetching} onClick={() => void list.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        )}
        {empty && (
          <EmptyState
            className="flex-1"
            icon={MagnifyingGlassIcon}
            title={t('topics.emptyTitle')}
            description={t('topics.emptyText')}
            action={
              <Button
                onClick={() => {
                  reset()
                  setQuery('')
                }}
              >
                {t('topics.reset')}
              </Button>
            }
          />
        )}
        {topics.length > 0 && (
          <div className={`${GRID} pt-1 pb-8`}>
            {topics.map((topic) => (
              <TopicTile
                key={topic.topicId}
                title={topicName(topic.names)}
                category={toCategoryCode(topic.category)}
                pictogram={topic.pictogramUrl ?? undefined}
                image={topic.imageUrl ?? topic.bannerUrl ?? undefined}
                onClick={() => void navigate(ROUTES.topic(topic.topicId))}
              />
            ))}
            <div className="col-span-full">
              <FeedFooter {...feedFooterProps(list)} endLabel={t('topics.end')} />
            </div>
          </div>
        )}
      </div>
    </Screen>
  )
}
