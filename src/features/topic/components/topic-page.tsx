import { topicDescription } from '@joutio/client-domain/authoring'
import { CheckIcon, HeartIcon, LightningIcon, ShareNetworkIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DuelSheet } from '@/features/play'
import { useShare } from '@/features/share'
import { TabNav } from '@/features/shell'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { useTabParam } from '@/shared/use-tab-param'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Button, Dialog, EmptyState, IconButton, JoutioTabs, ParallaxScreen, Pill, ProgressBar, Screen, Skeleton, Stat, TabsScrollView, tokens } from '@/ui'
import { useFollowTopic, useTopicLeaderboard, useTopicOverview } from '../hooks/use-topic'
import { formatNumber } from '../lib/format'
import { BOARD_TOP, BoardTab, GamesTab, MyBoardRow, ProgressTab } from './topic-tabs'

// MVP : le Mur reste désactivé (`fiche-sujet.md` § 2, 2026-11-07).
const TABS: readonly { value: Tab; label: MessageKey }[] = [
  { value: 'games', label: 'topic.tabGames' },
  { value: 'board', label: 'topic.tabBoard' },
  { value: 'progress', label: 'topic.tabProgress' },
]
type Tab = 'games' | 'board' | 'progress'

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-3 px-4" aria-label={t('home.loading')}>
      <Skeleton shape="row" />
      <Skeleton shape="card" />
      <Skeleton shape="card" />
    </div>
  )
}

/** Questions jouées : la part du sujet déjà vue en duel, et ce qui reste à découvrir (carte sans titre, 2026-11-07). */
function PlayedQuestions({ done, total, percent }: { done: number; total: number; percent: number }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const left = Math.max(0, total - done)
  const questions = (count: number) => t(count > 1 ? 'topic.questionsMany' : 'topic.questionsOne', { count: formatNumber(count, language) })
  return (
    <div className="grid gap-2 rounded-jo-lg bg-jo-surface p-4">
      <ProgressBar label={t('topic.played', { done: formatNumber(done, language), total: questions(total) })} value={percent} showValue />
      <span className="jo-type-caption text-jo-muted">{left === 0 ? t('topic.allPlayed') : t('topic.leftToPlay', { count: questions(left) })}</span>
    </div>
  )
}

/**
 * Fiche sujet (`design/specs/screens/fiche-sujet.md`, lab `/screens/fiche-sujet?view=compact`) : image en parallaxe,
 * catégorie en `Pill` d'univers, actions et chiffres du sujet, onglets Parties, Classement et Progression. Le partage
 * devient « Copier le lien » (`web.md`). « Lancer un duel » ouvre la feuille des quatre modes (`lancer-partie.md`).
 */
export function TopicPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const { topicId = '' } = useParams()
  const overview = useTopicOverview(topicId)
  const board = useTopicLeaderboard(topicId)
  const follow = useFollowTopic(topicId)
  const [tab, setTab] = useTabParam<Tab>(['games', 'board', 'progress'], 'games')
  const [unfollowOpen, setUnfollowOpen] = useState(false)
  const [duelOpen, setDuelOpen] = useState(false)

  const data = overview.data
  const topic = data?.topic
  // Description dans la langue du joueur, sinon la française (2026-11-13).
  const description = topic ? topicDescription(topic, language) : null
  const name = topic ? topicName(topic.names, language) : ''
  const category = toCategoryCode(topic?.category)
  const followed = topic?.followed ?? false
  // Brouillon : les nouveaux départs de partie sont désactivés.
  const playable = topic?.status === 'PUBLISHED'
  const myEntry = board.data?.me
  const showMyRow = tab === 'board' && myEntry && myEntry.rank > BOARD_TOP
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.topics, { replace: true }))

  const toggleFollow = () => {
    if (!topic || follow.isPending) return
    if (followed) setUnfollowOpen(true)
    else follow.mutate(true)
  }
  const share = useShare()
  const shareTopic = () => {
    if (!topic) return
    share({ kind: 'topic', id: topic.topicId, title: t('share.topicTitle'), text: t('share.topicText', { topic: name }) })
  }

  if (overview.isError) {
    return (
      <Screen bottomNav={<TabNav active="topics" />}>
        <EmptyState
          className="pt-24"
          icon={WarningCircleIcon}
          title={t('topic.errorTitle')}
          description={t('home.errorText')}
          action={
            <div className="flex justify-center gap-3">
              <Button variant="gray" tone="neutral" onClick={back}>
                {t('topic.back')}
              </Button>
              <Button loading={overview.isRefetching} onClick={() => void overview.refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          }
        />
      </Screen>
    )
  }

  const stats = [
    { label: t('topic.mastery'), value: data?.myProgress ? tokens.tier[data.myProgress.tier].label : '—' },
    { label: t('topic.followers'), value: topic ? formatNumber(topic.followersCount, language) : '—' },
    { label: t('topic.questions'), value: topic ? formatNumber(topic.questionsCount, language) : '—' },
  ]

  return (
    <ParallaxScreen
      barTitleStart
      image={topic ? (topic.bannerUrl ?? topic.imageUrl ?? undefined) : undefined}
      title={name}
      eyebrow={topic ? <Pill category={category}>{tokens.category[category].label}</Pill> : undefined}
      onBack={back}
      right={
        <>
          <IconButton icon={ShareNetworkIcon} label={t('profile.share')} media onClick={shareTopic} />
        </>
      }
      intro={
        <div className="grid gap-3">
          {/* Description du sujet, sous le titre de l'image (2026-11-13), saisie dans l'atelier. */}
          {description && <p className="jo-type-body m-0 whitespace-pre-line text-jo-muted">{description}</p>}
          <div className="grid grid-cols-[65fr_35fr] gap-2">
            <Button full icon={LightningIcon} disabled={!playable} onClick={() => setDuelOpen(true)}>
              {t('topic.duel')}
            </Button>
            <Button
              full
              icon={followed ? CheckIcon : undefined}
              variant={followed ? 'gray' : 'tinted'}
              tone={followed ? 'neutral' : 'accent'}
              disabled={!topic}
              aria-pressed={followed}
              onClick={toggleFollow}
            >
              {t(followed ? 'topic.followed' : 'topic.follow')}
            </Button>
          </div>
          {topic?.status === 'DRAFT' && <p className="jo-type-callout text-jo-muted">{t('topic.draft')}</p>}
          <div className="grid grid-cols-3 gap-2">
            {data ? stats.map((stat) => <Stat key={stat.label} {...stat} compact />) : stats.map((stat) => <Skeleton key={stat.label} shape="card" className="h-[76px]" />)}
          </div>
          {data && (
            <PlayedQuestions
              done={data.myProgress?.completedQuestions ?? 0}
              total={data.myProgress?.totalQuestions ?? data.topic.questionsCount}
              percent={data.myProgress?.completionPercent ?? 0}
            />
          )}
        </div>
      }
      sticky={<JoutioTabs label={t('topic.tabs')} options={TABS.map((item) => ({ value: item.value, label: t(item.label) }))} value={tab} onChange={setTab} scrollable />}
      bottomBar={showMyRow ? <MyBoardRow entry={myEntry} /> : undefined}
      bottomNav={<TabNav active="topics" />}
      overlay={
        <>
        {topic && <DuelSheet open={duelOpen} onClose={() => setDuelOpen(false)} topic={{ topicId: topic.topicId, name, category: topic.category }} />}
        <Dialog
          open={unfollowOpen}
          onClose={() => setUnfollowOpen(false)}
          title={t('topic.unfollowTitle', { name })}
          message={t('topic.unfollowText')}
          icon={HeartIcon}
          tone="danger"
          sheet
          actions={[
            {
              label: t('topic.unfollow'),
              tone: 'destructive',
              onClick: () => {
                setUnfollowOpen(false)
                follow.mutate(false)
              },
            },
            { label: t('topic.cancel'), variant: 'plain', onClick: () => setUnfollowOpen(false) },
          ]}
        />
        </>
      }
    >
      <div className="pt-1 pb-8">
        {!data ? (
          <Loading />
        ) : (
          <TabsScrollView
            value={tab}
            onChange={setTab}
            pages={[
              { value: 'games', content: <GamesTab topicId={topicId} /> },
              { value: 'board', content: <BoardTab topicId={topicId} /> },
              { value: 'progress', content: <ProgressTab overview={data} /> },
            ]}
          />
        )}
      </div>
    </ParallaxScreen>
  )
}
