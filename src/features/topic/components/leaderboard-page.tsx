import type { LeaderboardEntryView } from '@joutio/client-domain/api-types'
import { SlidersHorizontalIcon, TrophyIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMe, usePlayerIdentity } from '@/features/me'
import { TabNav } from '@/features/shell'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { feedFooterProps } from '@/shared/paging'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import { Button, EmptyState, FeedFooter, IconButton, ListRow, MobileSheet, MobileTopBar, Podium, RadioGroup, Screen, SectionHeader, Skeleton, tokens } from '@/ui'
import { useTopicBoard, useTopicOverview } from '../hooks/use-topic'
import { formatNumber } from '../lib/format'
import { DEFAULT_BOARD_FILTERS, type BoardFilters, type BoardPeriod, type BoardScope } from '../lib/topic-service'
import { BoardRow, MyBoardRow } from './topic-tabs'

const PERIODS: readonly { value: BoardPeriod; label: MessageKey }[] = [
  { value: 'ALL_TIME', label: 'board.allTime' },
  { value: 'MONTHLY', label: 'board.month' },
]
const SCOPES: readonly { value: BoardScope; label: MessageKey }[] = [
  { value: 'WORLD', label: 'board.world' },
  { value: 'FOLLOWING', label: 'board.following' },
  { value: 'COUNTRY', label: 'board.country' },
]

function Options<V extends string>({ title, options, value, onChange }: { title: string; options: readonly { value: V; label: MessageKey }[]; value: V; onChange: (value: V) => void }) {
  const t = useT()
  return (
    <section className="grid gap-3">
      <SectionHeader title={title} />
      <RadioGroup label={title} className="overflow-hidden rounded-jo-lg bg-jo-raised">
        {options.map((option, index) => (
          <ListRow key={option.value} label={t(option.label)} control="radio" on={value === option.value} onToggle={() => onChange(option.value)} last={index === options.length - 1} />
        ))}
      </RadioGroup>
    </section>
  )
}

/**
 * Tous les classements (`design/specs/screens/classements.md`, lab `/screens/classements?view=compact`) : période et
 * portée en feuille, podium puis rangs 4 et suivants, 20 joueurs par page. Ma ligne est une barre fixe tant que mon
 * rang n'est pas dans la liste affichée, mise en évidence dans la liste ensuite.
 */
export function LeaderboardPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const { topicId = '' } = useParams()
  const me = useMe().data
  const topic = useTopicOverview(topicId).data?.topic
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_BOARD_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const board = useTopicBoard(topicId, filters)
  const entries = board.data?.pages.flatMap((page) => page.entries.content) ?? []
  const mine = board.data?.pages[0]?.me ?? null
  const [first, second, third, ...rest] = entries
  const podium = [first, second, third].filter((entry): entry is LeaderboardEntryView => entry !== undefined)
  const avatars = [useUserAvatar(first), useUserAvatar(second), useUserAvatar(third)]
  const identity = usePlayerIdentity()
  const listed = mine ? entries.some((entry) => entry.userId === mine.userId) : true
  const monthly = filters.period === 'MONTHLY'
  const value = (entry: LeaderboardEntryView) => formatNumber(monthly ? entry.monthlyXp : entry.totalXp, language)
  const sub = (entry: LeaderboardEntryView) => (entry.provisional ? t('topic.provisional') : tokens.tier[tierOf(entry.rating)].label)
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const legend = [
    monthly
      ? t('board.monthLegend', {
          month: new Intl.DateTimeFormat(language, { month: 'long' }).format(now),
          reset: new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(nextMonth),
        })
      : t('board.allTimeLegend'),
    t(SCOPES.find((scope) => scope.value === filters.scope)!.label),
  ].join(' · ')
  const scopes = SCOPES.filter((scope) => scope.value !== 'COUNTRY' || Boolean(me?.country))
  const filterActive = filters.period !== DEFAULT_BOARD_FILTERS.period || filters.scope !== DEFAULT_BOARD_FILTERS.scope
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.topic(topicId), { replace: true }))

  return (
    <Screen
      header={
        <MobileTopBar
          variant="inline"
          back={t('history.backTopic')}
          title={t('topic.allRankings')}
          subtitle={topic ? topicName(topic.names, language) : undefined}
          onBack={back}
          right={
            <IconButton
              icon={SlidersHorizontalIcon}
              label={t('board.filter')}
              variant="gray"
              tone="neutral"
              badge={filterActive ? 'dot' : undefined}
              onClick={() => setSheetOpen(true)}
            />
          }
        />
      }
      bottomBar={mine && !listed ? <MyBoardRow entry={mine} /> : undefined}
      bottomNav={<TabNav active="topics" />}
      overlay={
        <MobileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t('board.filter')}
          action={
            <Button variant="plain" size="S" onClick={() => setFilters(DEFAULT_BOARD_FILTERS)}>
              {t('topics.reset')}
            </Button>
          }
          footer={
            <Button full onClick={() => setSheetOpen(false)}>
              {t('board.show')}
            </Button>
          }
        >
          <div className="grid gap-6">
            <Options title={t('board.period')} options={PERIODS} value={filters.period} onChange={(period) => setFilters((current) => ({ ...current, period }))} />
            <Options title={t('board.scope')} options={scopes} value={filters.scope} onChange={(scope) => setFilters((current) => ({ ...current, scope }))} />
          </div>
        </MobileSheet>
      }
    >
      <div className="grid gap-3 px-4 pt-1 pb-8">
        <span className="jo-type-caption text-pretty text-jo-muted">{legend}</span>
        {board.isPending ? (
          <>
            <Skeleton shape="card" />
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} shape="row" />
            ))}
          </>
        ) : board.isError && !board.data ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('topic.boardError')}
            description={t('home.errorText')}
            action={
              <Button loading={board.isRefetching} onClick={() => void board.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : entries.length === 0 ? (
          <EmptyState icon={TrophyIcon} title={t('board.empty')} />
        ) : (
          <>
            <Podium
              players={podium.map((entry, index) => ({
                name: entry.pseudonym,
                src: avatars[index],
                tier: entry.provisional ? undefined : tierOf(entry.rating),
                value: value(entry),
                premium: identity.premium(entry),
                onOpen: identity.open(entry.userId),
              }))}
            />
            {rest.length > 0 && (
              <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
                {rest.map((entry, index) => (
                  <BoardRow key={entry.userId} entry={entry} sub={sub(entry)} trail={value(entry)} highlight={entry.userId === mine?.userId} last={index === rest.length - 1} />
                ))}
              </div>
            )}
            <FeedFooter
              {...feedFooterProps({ ...board, hasNextPage: board.hasNextPage ?? false })}
              endLabel={t('board.end')}
            />
          </>
        )}
      </div>
    </Screen>
  )
}
