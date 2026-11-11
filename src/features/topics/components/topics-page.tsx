import type { TopicSort } from '@joutio/client-domain/api-types'
import { ArrowsDownUpIcon, BellIcon, EyeSlashIcon, MagnifyingGlassIcon, SlidersHorizontalIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnreadCount } from '@/features/notifications'
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
  TopicCard,
  tokens,
  type CategoryCode,
} from '@/ui'
import { useTopicFacets, useTopics } from '../hooks/use-topics'
import { DEFAULT_TOPIC_SORT } from '../lib/topics-service'

const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]

/** « Les plus suivis » = `POPULAR`, « Les plus joués » = `MOST_PLAYED`, « Nouveautés » = `RECENT` (`sujets.md` § 5). */
const SORTS: readonly { value: TopicSort; label: MessageKey }[] = [
  { value: 'POPULAR', label: 'topics.sortPopular' },
  { value: 'MOST_PLAYED', label: 'topics.sortPlayed' },
  { value: 'RECENT', label: 'topics.sortRecent' },
]

const toggle = (list: CategoryCode[], category: CategoryCode) => (list.includes(category) ? list.filter((item) => item !== category) : [...list, category])

type FiltersProps = {
  selected: CategoryCode[]
  onSelected: (selected: CategoryCode[]) => void
  sort: TopicSort
  onSort: (sort: TopicSort) => void
  hideFollowed: boolean
  onHideFollowed: (hide: boolean) => void
}

/** Univers, tri et sujets suivis : contenu de la feuille Filtres. */
function TopicFiltersForm({ selected, onSelected, sort, onSort, hideFollowed, onHideFollowed }: FiltersProps) {
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
        <SectionHeader title={t('topics.display')} />
        <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
          <ListRow icon={EyeSlashIcon} label={t('topics.hideFollowed')} control="toggle" on={hideFollowed} onToggle={onHideFollowed} last />
        </div>
      </section>
    </div>
  )
}

function Loading() {
  const t = useT()
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-6" aria-label={t('home.loading')}>
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} shape="card" />
      ))}
    </div>
  )
}

/**
 * Sujets (`design/specs/screens/sujets.md`, lab `/screens/sujets?view=compact`) : barre fixe avec recherche et
 * Filtres, puces d'univers, compteur et tri, grille de cartes portrait paginée par 20 côté serveur.
 */
export function TopicsPage() {
  const t = useT()
  const navigate = useNavigate()
  const unread = useUnreadCount().data?.count ?? 0
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const [selected, setSelected] = useState<CategoryCode[]>([])
  const [sort, setSort] = useState<TopicSort>(DEFAULT_TOPIC_SORT)
  const [hideFollowed, setHideFollowed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { anchor, toThreshold, toTop } = useStickyAnchor()

  useEffect(toThreshold, [search, selected, sort, hideFollowed, toThreshold])

  const list = useTopics({ query: search, categories: selected, sort, hideFollowed })
  const facets = useTopicFacets(search)
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
    setHideFollowed(false)
  }

  return (
    <Screen
      header={
        <>
          <MobileTopBar
            title={t('nav.topics')}
            right={
              <IconButton
                icon={BellIcon}
                label={t('home.notifications')}
                variant="plain"
                tone="neutral"
                badge={unread > 0 ? 'dot' : undefined}
                onClick={() => void navigate(ROUTES.notifications)}
              />
            }
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2">
            <SearchField value={query} onChange={setQuery} placeholder={t('topics.search')} label={t('topics.search')} />
            <IconButton
              icon={SlidersHorizontalIcon}
              label={t('topics.filters')}
              variant="gray"
              tone="neutral"
              badge={selected.length || undefined}
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
          <TopicFiltersForm selected={selected} onSelected={setSelected} sort={sort} onSort={setSort} hideFollowed={hideFollowed} onHideFollowed={setHideFollowed} />
        </MobileSheet>
      }
    >
      <div className="flex min-h-full flex-col">
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
        {list.isPending && <Loading />}
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
          <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-8">
            {topics.map((topic) => (
              <TopicCard
                key={topic.topicId}
                title={topicName(topic.names)}
                category={toCategoryCode(topic.category)}
                image={topic.imageUrl ?? undefined}
                orientation="portrait"
                onClick={() => void navigate(ROUTES.topic(topic.topicId))}
              />
            ))}
            <div className="col-span-2">
              <FeedFooter {...feedFooterProps(list)} endLabel={t('topics.end')} />
            </div>
          </div>
        )}
      </div>
    </Screen>
  )
}
