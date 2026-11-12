import type { BadgeCollectionView, MeView, TitlesView, TopicStatView } from '@joutio/client-domain/api-types'
import { ChartLineUpIcon, ClockCounterClockwiseIcon, CrownSimpleIcon, MedalIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameGroups } from '@/features/history'
import { formatNumber, MASTERY_TIERS, useWearTitle } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toCategoryCode, topicName } from '@/shared/topics'
import {
  BadgeFamilyRow,
  Button,
  EmptyState,
  OutcomeBar,
  ProgressBar,
  SectionHeader,
  Skeleton,
  Stat,
  Streak,
  TitleRow,
  TopicsDonut,
  categoryColor,
} from '@/ui'
import { useMyActivity, useMyBadges, useMyRecentGames, useMyTopics } from '../hooks/use-profile'
import { badgesSummary, familiesOf, type BadgeFamilySummary } from '../lib/badges'
import { rankProgress, titleLabel } from '../lib/ranks'
import { streakHint, weekOf } from '../lib/streak'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

function Rows() {
  return (
    <div className="grid gap-3">
      <Skeleton shape="card" />
      <Skeleton shape="card" />
    </div>
  )
}

function ErrorState({ title, retrying, onRetry }: { title: string; retrying: boolean; onRetry: () => void }) {
  const t = useT()
  return (
    <EmptyState
      icon={WarningCircleIcon}
      title={title}
      description={t('home.errorText')}
      action={
        <Button loading={retrying} onClick={onRetry}>
          {t('common.retry')}
        </Button>
      }
    />
  )
}

/** Onglet Statistiques : série, rang, bilan et sujets joués (`profil.md` § 2). */
export function StatsTab({ me, onRanks }: { me: MeView; onRanks: () => void }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const activity = useMyActivity()
  const topics = useMyTopics()
  const stats = me.stats
  const progression = me.progression
  const tier = progression && !progression.provisional ? tierOf(progression.rating) : undefined
  const rank = tier && progression ? rankProgress(tier, progression.rating, t, language) : undefined
  const donut = useMemo(
    () =>
      (topics.data ?? [])
        .filter((topic: TopicStatView) => topic.games > 0)
        .map((topic) => ({ key: topic.topicId, label: topicName(topic.names, language), value: topic.games, color: categoryColor(toCategoryCode(topic.category)) })),
    [topics.data, language],
  )
  const played = (stats?.played ?? 0) > 0

  return (
    <div className="grid gap-6 px-4 pt-1 pb-8">
      <section className="grid gap-3">
        <SectionHeader
          title={t('profile.streak')}
          action={
            <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.myStreak)}>
              {t('profile.calendar')}
            </Button>
          }
        />
        <div className="rounded-jo-lg bg-jo-surface p-4">
          {activity.isPending ? <Skeleton shape="card" /> : <Streak count={activity.data?.currentStreak ?? 0} hint={streakHint(activity.data, t)} week={weekOf(activity.data)} />}
        </div>
      </section>
      {!played ? (
        <EmptyState icon={ChartLineUpIcon} title={t('profile.noStatsTitle')} description={t('profile.noStatsText')} />
      ) : (
        <>
          <section className="grid gap-3">
            <SectionHeader
              title={t('profile.rank')}
              action={
                <Button variant="plain" size="S" onClick={onRanks}>
                  {t('profile.allRanks')}
                </Button>
              }
            />
            <div className="grid gap-2 rounded-jo-lg bg-jo-surface p-4">
              {rank && tier ? (
                <>
                  <ProgressBar value={rank.progress} label={rank.label} tone={tier} />
                  <span className="jo-type-caption text-jo-muted">{rank.next}</span>
                </>
              ) : (
                <span className="jo-type-callout text-jo-muted">{t('profile.provisional', { count: progression?.ratedGames ?? 0 })}</span>
              )}
            </div>
          </section>
          {stats && (
            <section className="grid gap-3">
              <SectionHeader title={t('profile.outcomes')} />
              <div className="grid grid-cols-3 gap-2">
                <Stat label={t('profile.wins')} value={formatNumber(stats.wins, language)} tone="up" compact />
                <Stat label={t(stats.draws > 1 ? 'profile.draws' : 'profile.draw')} value={formatNumber(stats.draws, language)} compact />
                <Stat label={t('profile.losses')} value={formatNumber(stats.losses, language)} tone="down" compact />
              </div>
              <div className="rounded-jo-lg bg-jo-surface p-4">
                <OutcomeBar wins={stats.wins} draws={stats.draws} losses={stats.losses} />
              </div>
            </section>
          )}
          <section className="grid gap-3">
            <SectionHeader
              title={t('profile.playedTopics')}
              action={
                <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.myPlayedTopics)}>
                  {t('home.seeAll')}
                </Button>
              }
            />
            <div className="rounded-jo-lg bg-jo-surface p-2">
              {topics.isPending ? <Skeleton shape="card" /> : <TopicsDonut label={t('profile.playedTopics')} data={donut} otherLabel={t('profile.others')} />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** Onglet Badges : résumé, puis une ligne par famille ; toucher une ligne ouvre son échelle. */
export function BadgesTab({ onOpen }: { onOpen: (family: BadgeFamilySummary) => void }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const badges = useMyBadges()
  const families = useMemo(() => (badges.data ? familiesOf(badges.data, t, language) : []), [badges.data, t, language])
  if (badges.isPending)
    return (
      <div className="px-4">
        <Rows />
      </div>
    )
  if (badges.isError && !badges.data)
    return <ErrorState title={t('profile.badgesError')} retrying={badges.isRefetching} onRetry={() => void badges.refetch()} />
  if ((badges.data as BadgeCollectionView).earnedCount === 0 && families.every((family) => family.progress === 0))
    return <EmptyState icon={MedalIcon} title={t('profile.noBadgesTitle')} description={t('profile.noBadgesText')} />
  return (
    <div className="grid gap-3 px-4 pt-1 pb-8">
      <span className="jo-type-caption text-jo-muted">{badgesSummary(badges.data!, t)}</span>
      {families.map((family) => (
        <BadgeFamilyRow key={family.family} name={family.name} icon={family.icon} meta={family.meta} earned={family.earned} progress={family.progress} onClick={() => onOpen(family)} />
      ))}
    </div>
  )
}

/**
 * Onglet Titres : `TitlesView` ne date pas les déblocages ; comme le mobile, l'onglet montre les **5 titres les plus
 * hauts** (sans groupage par date, `titres.md` § 6). Porter un titre met à jour celui sous la bannière.
 */
export function TitlesTab({ titles, retrying, error, onRetry }: { titles?: TitlesView; retrying: boolean; error: boolean; onRetry: () => void }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const wear = useWearTitle()
  if (!titles && !error)
    return (
      <div className="px-4">
        <Rows />
      </div>
    )
  if (!titles) return <ErrorState title={t('profile.titlesError')} retrying={retrying} onRetry={onRetry} />
  if (titles.titles.length === 0) return <EmptyState icon={CrownSimpleIcon} title={t('profile.noTitlesTitle')} description={t('profile.noTitlesText')} />
  const top = [...titles.titles].sort((a, b) => MASTERY_TIERS.indexOf(b.tier) - MASTERY_TIERS.indexOf(a.tier)).slice(0, 5)
  return (
    <div className="grid gap-4 px-4 pt-1 pb-8">
      <SectionHeader
        title={t('profile.lastTitles')}
        action={
          <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.myTitles)}>
            {t('home.seeAll')}
          </Button>
        }
      />
      <div className={CARD}>
        {top.map((title, index) => {
          const worn = titles.equippedKey === title.key
          return (
            <TitleRow
              key={title.key}
              tier={title.tier}
              title={titleLabel(title, language)}
              topic={topicName(title.topic.names, language)}
              worn={worn}
              onWear={() => {
                if (!wear.isPending) wear.mutate(worn ? null : title.key)
              }}
              last={index === top.length - 1}
            />
          )
        })}
      </div>
    </div>
  )
}

/** Onglet Historique : les 10 dernières parties, groupées par jour. */
export function HistoryTab() {
  const t = useT()
  const navigate = useNavigate()
  const games = useMyRecentGames()
  return (
    <div className="grid gap-4 px-4 pt-1 pb-8">
      <SectionHeader
        title={t('profile.lastGames')}
        action={
          <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.myGames())}>
            {t('home.seeAll')}
          </Button>
        }
      />
      {games.isPending ? (
        <Rows />
      ) : games.isError && !games.data ? (
        <ErrorState title={t('history.error')} retrying={games.isRefetching} onRetry={() => void games.refetch()} />
      ) : (games.data?.content.length ?? 0) === 0 ? (
        <EmptyState icon={ClockCounterClockwiseIcon} title={t('history.empty')} description={t('history.emptyText')} />
      ) : (
        <GameGroups games={games.data!.content} />
      )}
    </div>
  )
}
