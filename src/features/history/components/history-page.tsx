import { ClockCounterClockwiseIcon, SlidersHorizontalIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { usePlayerProfile } from '@/features/play'
import { TabNav } from '@/features/shell'
import { useTopicOverview } from '@/features/topic'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { feedFooterProps } from '@/shared/paging'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { Button, EmptyState, FeedFooter, IconButton, ListRow, MobileSheet, MobileTopBar, RadioGroup, Screen, SectionHeader, Skeleton } from '@/ui'
import { useHistoryGames } from '../hooks/use-history'
import { DEFAULT_HISTORY_FILTERS, type HistoryFilterState, type HistoryOpponentType, type HistoryOutcome, type HistorySort } from '../lib/history-service'
import { GameGroups } from './game-groups'
import { finishedGames } from '../lib/outcomes'

const TYPES: readonly { value: HistoryOpponentType | undefined; label: MessageKey }[] = [
  { value: undefined, label: 'history.typeAll' },
  { value: 'HUMAN', label: 'history.typeDuels' },
  { value: 'BOT', label: 'history.typeTraining' },
]
const RESULTS: readonly { value: HistoryOutcome; label: MessageKey }[] = [
  { value: 'ALL', label: 'history.resultAll' },
  { value: 'WIN', label: 'history.resultWins' },
  { value: 'LOSS', label: 'history.resultLosses' },
  { value: 'DRAW', label: 'history.resultDraws' },
]
const SORTS: readonly { value: HistorySort; label: MessageKey }[] = [
  { value: 'RECENT', label: 'history.sortRecent' },
  { value: 'OLDEST', label: 'history.sortOldest' },
]

function Options<V>({ title, options, value, onChange }: { title: string; options: readonly { value: V; label: MessageKey }[]; value: V; onChange: (value: V) => void }) {
  const t = useT()
  return (
    <section className="grid gap-3">
      <SectionHeader title={title} />
      <RadioGroup label={title} className="overflow-hidden rounded-jo-lg bg-jo-raised">
        {options.map((option, index) => (
          <ListRow key={option.label} label={t(option.label)} control="radio" on={value === option.value} onToggle={() => onChange(option.value)} last={index === options.length - 1} />
        ))}
      </RadioGroup>
    </section>
  )
}

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-2 px-4 pt-1 pb-8" aria-label={t('history.loading')}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} shape="row" className="h-16" />
      ))}
    </div>
  )
}

/**
 * Toutes les parties (`design/specs/screens/historique.md`, lab `/screens/historique?view=compact`) : filtres Type,
 * Résultat et Tri en feuille, 20 parties par page groupées par jour. `?topicId=` depuis une Fiche sujet,
 * `?opponentId=` depuis une Fiche joueur (sans filtre Type : un entraînement se joue contre un robot).
 */
export function HistoryPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const topicId = params.get('topicId') ?? undefined
  const opponentId = params.get('opponentId') ?? undefined
  const userId = useMe().data?.userId ?? ''
  const topic = useTopicOverview(topicId ?? '').data?.topic
  const opponent = usePlayerProfile(opponentId ?? '', Boolean(opponentId)).data
  const [filters, setFilters] = useState<HistoryFilterState>(DEFAULT_HISTORY_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const query = useMemo(
    () => ({ ...filters, topicId, opponentId, opponentType: opponentId ? 'HUMAN' as const : filters.opponentType }),
    [filters, topicId, opponentId],
  )
  const list = useHistoryGames(userId, query)
  const games = finishedGames(list.data?.pages.flatMap((page) => page.content) ?? [])
  const total = list.data?.pages[0]?.totalElements ?? 0
  const filterActive = (!opponentId && filters.opponentType !== undefined) || filters.outcome !== 'ALL' || filters.sort !== 'RECENT'
  const count = t(total > 1 ? 'history.countMany' : 'history.countOne', { count: total })
  const reset = () => setFilters(DEFAULT_HISTORY_FILTERS)
  const set = <K extends keyof HistoryFilterState>(key: K) => (value: HistoryFilterState[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(topicId ? ROUTES.topic(topicId) : opponentId ? ROUTES.player(opponentId) : ROUTES.me, { replace: true }))

  return (
    <Screen
      header={
        <MobileTopBar
          variant="inline"
          back={t(topicId ? 'history.backTopic' : opponentId ? 'history.backPlayer' : 'nav.profile')}
          title={t('history.title')}
          subtitle={topic ? topicName(topic.names, language) : opponent ? t('history.against', { name: opponent.pseudonym }) : undefined}
          onBack={back}
          right={
            <IconButton
              icon={SlidersHorizontalIcon}
              label={t('history.filter')}
              variant="gray"
              tone="neutral"
              badge={filterActive ? 'dot' : undefined}
              onClick={() => setSheetOpen(true)}
            />
          }
        />
      }
      bottomNav={<TabNav active={topicId ? 'topics' : opponentId ? 'social' : 'profile'} />}
      overlay={
        <MobileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t('history.filter')}
          action={
            <Button variant="plain" size="S" onClick={reset}>
              {t('topics.reset')}
            </Button>
          }
          footer={
            <Button full onClick={() => setSheetOpen(false)}>
              {t('history.show', { count })}
            </Button>
          }
        >
          <div className="grid gap-6">
            {!opponentId && <Options title={t('history.type')} options={TYPES} value={filters.opponentType} onChange={set('opponentType')} />}
            <Options title={t('history.result')} options={RESULTS} value={filters.outcome} onChange={set('outcome')} />
            <Options title={t('history.sort')} options={SORTS} value={filters.sort} onChange={set('sort')} />
          </div>
        </MobileSheet>
      }
    >
      {list.isPending ? (
        <Loading />
      ) : list.isError && !list.data ? (
        <EmptyState
          className="pt-16"
          icon={WarningCircleIcon}
          title={t('history.error')}
          description={t('home.errorText')}
          action={
            <Button loading={list.isRefetching} onClick={() => void list.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : games.length === 0 ? (
        <EmptyState
          className="pt-16"
          icon={ClockCounterClockwiseIcon}
          title={t(topicId ? 'history.emptyTopic' : opponentId ? 'history.emptyPlayer' : 'history.empty')}
          description={t(filterActive ? 'history.emptyFiltered' : topicId ? 'history.emptyTopicText' : 'history.emptyText')}
          action={filterActive ? <Button onClick={reset}>{t('topics.reset')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 px-4 pt-1 pb-8">
          <span className="jo-type-caption text-jo-muted">{count}</span>
          <GameGroups games={games} />
          <FeedFooter {...feedFooterProps(list)} endLabel={t(topicId ? 'history.endTopic' : opponentId ? 'history.endPlayer' : 'history.end')} />
        </div>
      )}
    </Screen>
  )
}
