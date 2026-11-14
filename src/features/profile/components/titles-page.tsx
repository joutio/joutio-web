import type { TitleView } from '@joutio/client-domain/api-types'
import { CrownSimpleIcon, SlidersHorizontalIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabNav } from '@/features/shell'
import { MASTERY_TIERS, useMyTitles, useWearTitle } from '@/features/topic'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import {
  Button,
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
  TitleRow,
  tokens,
  type TierCode,
} from '@/ui'
import { titleLabel } from '../lib/ranks'

/** Pagination par sujet : cinq sujets par page (`titres.md` § 3). */
const PAGE = 5

type Sort = 'RECENT' | 'OLDEST' | 'ALPHA'
const SORTS: readonly { value: Sort; label: MessageKey }[] = [
  { value: 'RECENT', label: 'titles.sortRecent' },
  { value: 'OLDEST', label: 'titles.sortOldest' },
  { value: 'ALPHA', label: 'titles.sortAlpha' },
]

/**
 * Tous les titres (`design/specs/screens/titres.md`, lab `/screens/titres?view=compact`) : recherche, filtre par rang
 * et tri, titres groupés par sujet du palier le plus haut au plus bas, cinq sujets par page. Toucher une ligne porte
 * ou enlève le titre. Sans `unlockedAt` (BFF), « Plus récents » suit l'ordre du serveur et « Plus anciens » l'inverse,
 * comme le mobile.
 */
export function TitlesPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const titles = useMyTitles()
  const wear = useWearTitle()
  const [query, setQuery] = useState('')
  const [rank, setRank] = useState<TierCode>()
  const [sort, setSort] = useState<Sort>('RECENT')
  const [pages, setPages] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const all = useMemo(() => titles.data?.titles ?? [], [titles.data])
  const filterActive = rank !== undefined || sort !== 'RECENT'

  const groups = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(language)
    const matching = all.filter(
      (title) =>
        (!rank || title.tier === rank) &&
        (!search || titleLabel(title, language).toLocaleLowerCase(language).includes(search) || topicName(title.topic.names, language).toLocaleLowerCase(language).includes(search)),
    )
    const byTopic = new Map<string, TitleView[]>()
    for (const title of matching) byTopic.set(title.topicId, [...(byTopic.get(title.topicId) ?? []), title])
    const list = [...byTopic.values()].map((items) => ({
      topicId: items[0]!.topicId,
      name: topicName(items[0]!.topic.names, language),
      titles: [...items].sort((a, b) => MASTERY_TIERS.indexOf(b.tier) - MASTERY_TIERS.indexOf(a.tier)),
    }))
    if (sort === 'OLDEST') list.reverse()
    if (sort === 'ALPHA') list.sort((a, b) => a.name.localeCompare(b.name, language))
    return list
  }, [all, query, rank, sort, language])

  const visible = groups.slice(0, pages * PAGE)
  const total = groups.reduce((sum, group) => sum + group.titles.length, 0)
  const count = t(total > 1 ? 'titles.countMany' : 'titles.countOne', { count: total })
  const reset = () => {
    setRank(undefined)
    setSort('RECENT')
    setPages(1)
  }
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.me, { replace: true }))
  const showHeader = all.length > 0 && !titles.isError

  return (
    <Screen
      header={
        <>
          <MobileTopBar variant="inline" back={t('nav.profile')} title={t('titles.title')} onBack={back} />
          {showHeader && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2">
              <SearchField
                value={query}
                onChange={(value) => {
                  setQuery(value)
                  setPages(1)
                }}
                placeholder={t('titles.search')}
                label={t('titles.search')}
              />
              <IconButton
                icon={SlidersHorizontalIcon}
                label={t('titles.filter')}
                variant="gray"
                tone="neutral"
                badge={filterActive ? 'dot' : undefined}
                onClick={() => setSheetOpen(true)}
              />
            </div>
          )}
        </>
      }
      bottomNav={<TabNav active="profile" />}
      overlay={
        <MobileSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t('titles.filter')}
          action={
            <Button variant="plain" size="S" onClick={reset}>
              {t('topics.reset')}
            </Button>
          }
          footer={
            <Button full onClick={() => setSheetOpen(false)}>
              {t('titles.show', { count })}
            </Button>
          }
        >
          <div className="grid gap-6">
            <section className="grid gap-3">
              <SectionHeader title={t('titles.rank')} />
              <RadioGroup label={t('titles.rank')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
                {[undefined, ...MASTERY_TIERS].map((tier, index) => (
                  <ListRow
                    key={tier ?? 'all'}
                    label={tier ? tokens.tier[tier].label : t('titles.allRanks')}
                    control="radio"
                    on={rank === tier}
                    onToggle={() => {
                      setRank(tier)
                      setPages(1)
                    }}
                    last={index === MASTERY_TIERS.length}
                  />
                ))}
              </RadioGroup>
            </section>
            <section className="grid gap-3">
              <SectionHeader title={t('titles.sort')} />
              <RadioGroup label={t('titles.sort')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
                {SORTS.map((option, index) => (
                  <ListRow
                    key={option.value}
                    label={t(option.label)}
                    control="radio"
                    on={sort === option.value}
                    onToggle={() => {
                      setSort(option.value)
                      setPages(1)
                    }}
                    last={index === SORTS.length - 1}
                  />
                ))}
              </RadioGroup>
            </section>
          </div>
        </MobileSheet>
      }
    >
      <div className="grid gap-4 px-4 pt-1 pb-8">
        {titles.isPending ? (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} shape="row" className="h-16" />)
        ) : titles.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('profile.titlesError')}
            description={t('home.errorText')}
            action={
              <Button loading={titles.isRefetching} onClick={() => void titles.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : all.length === 0 ? (
          <EmptyState icon={CrownSimpleIcon} title={t('profile.noTitlesTitle')} description={t('profile.noTitlesText')} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={CrownSimpleIcon}
            title={t(query.trim() ? 'titles.noMatch' : 'titles.noRank')}
            action={
              query.trim() ? (
                <Button onClick={() => setQuery('')}>{t('titles.clearSearch')}</Button>
              ) : filterActive ? (
                <Button onClick={reset}>{t('topics.reset')}</Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <span className="jo-type-caption text-jo-muted">{count}</span>
            {visible.map((group) => (
              <section key={group.topicId} className="grid gap-2">
                <span className="jo-type-caption font-semibold text-jo-muted">{group.name}</span>
                <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
                  {group.titles.map((title, index) => {
                    const worn = titles.data?.equippedKey === title.key
                    return (
                      <TitleRow
                        key={title.key}
                        tier={title.tier}
                        title={titleLabel(title, language)}
                        worn={worn}
                        onWear={() => {
                          if (!wear.isPending) wear.mutate(worn ? null : title.key)
                        }}
                        last={index === group.titles.length - 1}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
            <FeedFooter
              state={visible.length < groups.length ? 'more' : 'end'}
              pages={pages}
              onLoadMore={() => setPages((value) => value + 1)}
              endLabel={t('titles.end')}
            />
          </>
        )}
      </div>
    </Screen>
  )
}
