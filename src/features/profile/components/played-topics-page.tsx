import { ChartLineUpIcon, CrownSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabNav } from '@/features/shell'
import { formatNumber, MASTERY_TIERS, MASTERY_XP } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { showPremium } from '@/features/premium'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Button, EmptyState, FeedFooter, MobileTopBar, Screen, Skeleton, TopicRow, tokens } from '@/ui'
import { useMyTopics } from '../hooks/use-profile'

const PAGE = 20

/**
 * Sujets joués (`profil.md` § 2, « Tout voir » de l'onglet Statistiques) : chaque sujet joué avec ses parties, son
 * palier de maîtrise et son XP, 20 par page, puis l'encart Premium pour le détail par sujet.
 */
export function PlayedTopicsPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const topics = useMyTopics()
  const [pages, setPages] = useState(1)
  const sorted = [...(topics.data ?? [])].filter((topic) => topic.games > 0).sort((a, b) => b.games - a.games || b.xp - a.xp)
  const visible = sorted.slice(0, pages * PAGE)
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.me, { replace: true }))
  const mastery = (xp: number) => MASTERY_TIERS.reduce((best, tier) => (xp >= MASTERY_XP[tier] ? tier : best), MASTERY_TIERS[0])

  return (
    <Screen header={<MobileTopBar variant="inline" back={t('nav.profile')} title={t('profile.playedTopics')} onBack={back} />} bottomNav={<TabNav active="profile" />}>
      <div className="grid gap-4 px-4 pt-1 pb-8">
        {topics.isPending ? (
          <>
            <Skeleton shape="row" />
            <Skeleton shape="row" />
            <Skeleton shape="row" />
          </>
        ) : topics.isError && !topics.data ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('profile.topicsError')}
            description={t('home.errorText')}
            action={
              <Button loading={topics.isRefetching} onClick={() => void topics.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState icon={ChartLineUpIcon} title={t('profile.noTopicsTitle')} description={t('profile.noStatsText')} />
        ) : (
          <>
            <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
              {visible.map((topic, index) => (
                <TopicRow
                  key={topic.topicId}
                  title={topicName(topic.names, language)}
                  category={toCategoryCode(topic.category)}
                  image={topic.pictogramUrl ?? topic.imageUrl ?? undefined}
                  sub={t('profile.topicSub', {
                    games: t(topic.games > 1 ? 'profile.gamesMany' : 'profile.gamesOne', { count: formatNumber(topic.games, language) }),
                    tier: tokens.tier[mastery(topic.xp)].label,
                    xp: formatNumber(topic.xp, language),
                  })}
                  last={index === visible.length - 1}
                  onClick={() => void navigate(ROUTES.topic(topic.topicId))}
                />
              ))}
            </div>
            <FeedFooter
              state={visible.length < sorted.length ? 'more' : 'end'}
              pages={pages}
              onLoadMore={() => setPages((count) => count + 1)}
              endLabel={t('profile.topicsEnd')}
            />
            <div className="grid gap-2">
              <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">{t('profile.premiumDetail')}</p>
              <Button full variant="tinted" icon={CrownSimpleIcon} onClick={() => showPremium()}>
                {t('profile.discoverPremium')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
