import type { TopicCardView } from '@joutio/client-domain/api-types'
import { BellIcon, CompassIcon, FireIcon, MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useUnreadCount } from '@/features/notifications'
import { useMyActivity } from '@/features/profile'
import { TabNav } from '@/features/shell'
import { PAGE_SIZE, useTopicFacets, useTopics, type TopicFilters } from '@/features/topics'
import { useT } from '@/lib/i18n'
import { feedFooterProps } from '@/shared/paging'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toCategoryCode, topicName } from '@/shared/topics'
import { useStickyAnchor } from '@/shared/use-sticky-anchor'
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  FeedFooter,
  IconButton,
  JoutioTabs,
  Logo,
  PlayerName,
  Pill,
  Rail,
  Screen,
  SectionHeader,
  Skeleton,
  StickyBar,
  TopicCard,
  TopicRow,
  TopTen,
  TOP_TEN_CARD_WIDTH,
  tokens,
  type CategoryCode,
} from '@/ui'
import { useHome } from '../hooks/use-home'
import { useAppBanner } from './app-banner'

const LANDSCAPE_WIDTH = 240

type Tab = 'for-you' | 'followed'

const imageOf = (topic: TopicCardView) => topic.imageUrl ?? undefined

function useOpenTopic() {
  const navigate = useNavigate()
  return (topic: TopicCardView) => void navigate(ROUTES.topic(topic.topicId))
}

function TopicRail({ title, topics, onSeeAll }: { title: string; topics: TopicCardView[]; onSeeAll: () => void }) {
  const t = useT()
  const open = useOpenTopic()
  return (
    <section className="grid gap-3">
      <SectionHeader
        className="px-4"
        title={title}
        action={
          <Button variant="plain" size="S" className="-mr-3" onClick={onSeeAll}>
            {t('home.seeAll')}
          </Button>
        }
      />
      <Rail itemWidth={LANDSCAPE_WIDTH} label={title}>
        {topics.map((topic) => (
          <TopicCard key={topic.topicId} title={topicName(topic.names)} category={toCategoryCode(topic.category)} image={imageOf(topic)} onClick={() => open(topic)} />
        ))}
      </Rail>
    </section>
  )
}

function ForYou({ trending, fresh }: { trending: TopicCardView[]; fresh: TopicCardView[] }) {
  const t = useT()
  const navigate = useNavigate()
  const open = useOpenTopic()
  const seeAll = () => void navigate(ROUTES.topics)
  return (
    <>
      {trending.length > 0 && (
        <TopTen
          title={t('home.topTen')}
          topics={trending.map((topic) => ({ title: topicName(topic.names), category: toCategoryCode(topic.category), image: imageOf(topic) }))}
          onSelect={(_, rank) => {
            const topic = trending[rank - 1]
            if (topic) open(topic)
          }}
          onSeeAll={seeAll}
        />
      )}
      {fresh.length > 0 && <TopicRail title={t('home.newTopics')} topics={fresh} onSeeAll={seeAll} />}
    </>
  )
}

/** Sujets suivis : 20 par page côté serveur (`GET /api/topics?followed=true`), puces d'univers des facettes. */
const followedFilters = (categories: readonly CategoryCode[]): TopicFilters => ({ query: '', categories, sort: 'ALPHA', followed: true })

function Followed() {
  const t = useT()
  const open = useOpenTopic()
  const [selected, setSelected] = useState<CategoryCode[]>([])
  const list = useTopics(followedFilters(selected))
  const facets = useTopicFacets('', true)
  const universes = (facets.data?.categories ?? []).filter((facet) => facet.count > 0).map((facet) => toCategoryCode(facet.category))
  const topics = list.data?.pages.flatMap((page) => page.topics) ?? []
  const toggle = (category: CategoryCode) => setSelected(selected.includes(category) ? selected.filter((item) => item !== category) : [...selected, category])

  return (
    <div className="grid min-w-0 gap-3">
      <div className="jo-no-scrollbar flex gap-2 overflow-x-auto px-4">
        <Chip selected={selected.length === 0} className="flex-none" onClick={() => setSelected([])}>
          {t('home.all')}
        </Chip>
        {universes.map((category) => (
          <Chip key={category} selected={selected.includes(category)} className="flex-none" onClick={() => toggle(category)}>
            {tokens.category[category].label}
          </Chip>
        ))}
      </div>
      {list.isPending ? (
        <div className="grid gap-3 px-4" aria-label={t('home.loading')}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} shape="row" />
          ))}
        </div>
      ) : (
        <>
          <div className="mx-4 overflow-hidden rounded-jo-lg bg-jo-surface">
            {topics.map((topic, index) => (
              <TopicRow
                key={topic.topicId}
                title={topicName(topic.names)}
                category={toCategoryCode(topic.category)}
                image={imageOf(topic)}
                last={index === topics.length - 1}
                onClick={() => open(topic)}
              />
            ))}
          </div>
          {topics.length >= PAGE_SIZE && <FeedFooter className="mx-4" {...feedFooterProps(list)} endLabel={t('home.followedEnd')} />}
        </>
      )}
    </div>
  )
}

const SKELETON_SECTIONS = [
  { width: TOP_TEN_CARD_WIDTH, className: 'h-[229px] flex-none' },
  { width: LANDSCAPE_WIDTH, className: 'flex-none' },
] as const

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-6" aria-label={t('home.loading')}>
      {SKELETON_SECTIONS.map(({ width, className }, section) => (
        <div key={section} className="grid gap-3 px-4">
          <Skeleton width={160} />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton shape="card" width={width} className={className} />
            <Skeleton shape="card" width={width} className={className} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Accueil (`design/specs/screens/accueil.md`, lab `/screens/accueil?view=compact`) : barre fixe (logo, recherche,
 * cloche), bonjour + rang + série qui défilent, onglets « Pour toi » / « Suivis » collés sous la barre. Une fois
 * collés, « Bonjour X » apparaît dans la barre. Toucher Accueil dans la bottom nav remonte en haut.
 */
export function HomePage() {
  const appBanner = useAppBanner()
  const t = useT()
  const navigate = useNavigate()
  const me = useMe()
  const home = useHome()
  const unread = useUnreadCount().data?.count ?? 0
  const streak = useMyActivity().data?.currentStreak ?? 0
  const [tab, setTab] = useState<Tab>('for-you')
  const followed = tab === 'followed'
  const [stuck, setStuck] = useState(false)
  const { anchor, toThreshold, toTop } = useStickyAnchor()
  const changeTab = (next: Tab) => {
    setTab(next)
    toThreshold()
  }

  const pseudonym = me.data?.pseudonym
  const greeting = pseudonym ? t('home.hello', { name: pseudonym }) : t('home.helloAnonymous')
  const rating = me.data?.progression?.rating
  const tier = rating !== undefined ? tierOf(rating) : undefined
  const data = home.data
  const empty = data && (followed ? data.followedTopics.length === 0 : data.trendingTopics.length === 0 && data.newTopics.length === 0)
  const explore = () => void navigate(ROUTES.topics)

  return (
    <Screen
      banner={appBanner}
      header={
        <header className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 pr-1.5 pl-4">
          <Logo variant="lockup" size={28} />
          <span aria-hidden={!stuck} className={`jo-transition max-w-[170px] ${stuck ? 'opacity-100' : 'opacity-0'}`}>
            <PlayerName name={greeting} premium={me.data?.premium === true} className="jo-type-headline" />
          </span>
          <div className="flex items-center gap-2 justify-self-end">
            <IconButton icon={MagnifyingGlassIcon} label={t('home.search')} variant="plain" tone="neutral" onClick={() => void navigate(ROUTES.search)} />
            <IconButton
              icon={BellIcon}
              label={t('home.notifications')}
              variant="plain"
              tone="neutral"
              badge={unread || undefined}
              onClick={() => void navigate(ROUTES.notifications)}
            />
          </div>
        </header>
      }
      bottomNav={<TabNav active="home" onReselect={toTop} />}
    >
      <div className="flex min-h-full flex-col">
        <div className="grid gap-2 px-4 pt-3 pb-2">
          <PlayerName as="h1" name={greeting} premium={me.data?.premium === true} badgeSize={22} className="jo-type-title-2" />
          {(tier || streak > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {tier && rating !== undefined && (
                <Badge variant="tier" tier={tier}>
                  {`${tokens.tier[tier].label} · ${rating}`}
                </Badge>
              )}
              {streak > 0 && <Pill icon={FireIcon}>{t(streak > 1 ? 'home.streakMany' : 'home.streakOne', { count: streak })}</Pill>}
            </div>
          )}
        </div>
        <div ref={anchor} />
        <StickyBar className="px-4 py-2" onStuckChange={setStuck}>
          <JoutioTabs
            label={t('home.tabs')}
            options={[
              { value: 'for-you', label: t('home.forYou') },
              { value: 'followed', label: t('home.followed') },
            ]}
            value={tab}
            onChange={changeTab}
          />
        </StickyBar>
        {empty && (
          <EmptyState
            className="flex-1"
            icon={CompassIcon}
            title={t(followed ? 'home.followedEmptyTitle' : 'home.emptyTitle')}
            description={t(followed ? 'home.followedEmptyText' : 'home.emptyText')}
            action={<Button onClick={explore}>{t('home.explore')}</Button>}
          />
        )}
        {home.isError && !data && (
          <EmptyState
            className="flex-1"
            icon={WarningCircleIcon}
            title={t('home.errorTitle')}
            description={t('home.errorText')}
            action={
              <Button loading={home.isRefetching} onClick={() => void home.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        )}
        {(home.isPending || (data && !empty)) && (
          <div className="grid gap-8 pt-4 pb-8">
            {home.isPending && <Loading />}
            {data && !empty && (followed ? <Followed /> : <ForYou trending={data.trendingTopics} fresh={data.newTopics} />)}
          </div>
        )}
      </div>
    </Screen>
  )
}
