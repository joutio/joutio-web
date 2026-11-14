import { countryFlag, countryName } from '@joutio/client-domain/geo'
import { CheckIcon, DotsThreeIcon, FlagIcon, LightningIcon, SwordIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { finishedGames, GameGroups, useHistoryGames } from '@/features/history'
import { useMe, usePlayerIdentity } from '@/features/me'
import { useChallengePlayer } from '@/features/play'
import { ReportPlayerSheet } from '@/features/result'
import { TabNav } from '@/features/shell'
import { formatNumber, useTopicOverview } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  IconButton,
  Menu,
  OutcomeBar,
  ParallaxScreen,
  Pill,
  SectionHeader,
  Skeleton,
  Stat,
  TitleRibbon,
  tokens,
  type TierCode,
} from '@/ui'
import { useFollowPlayer, useHeadToHead, usePlayerProfile } from '../hooks/use-player'
import { presenceLine } from '../lib/presence'
import { ChallengeTopicSheet } from './challenge-topic-sheet'

/** Bannière de 336 px, comme le Profil (`fiche-joueur.md`). */
const HERO_HEIGHT = 336

/**
 * Fiche joueur (`design/specs/screens/fiche-joueur.md`, lab `/screens/fiche-joueur?view=compact`) : bannière en
 * parallaxe, avatar, titre porté, rang, pays, présence, puis Défier (65 %) et Suivre (35 %) qui passent dans la barre
 * compacte au défilement ; « Ton bilan » et les 10 dernières parties contre lui. Le menu ⋯ porte Signaler ; Bloquer
 * attend son endpoint BFF (écart consigné). Ma propre fiche renvoie au Profil.
 */
export function PlayerPage() {
  const { userId = '' } = useParams()
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const me = useMe()
  const identity = usePlayerIdentity()
  const profile = usePlayerProfile(userId)
  const head = useHeadToHead(userId)
  const follow = useFollowPlayer(userId)
  const challenge = useChallengePlayer()
  const myId = me.data?.userId ?? ''
  const games = useHistoryGames(myId, { opponentId: userId, outcome: 'ALL', sort: 'RECENT' })
  const data = profile.data
  const src = useUserAvatar(data)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeKey, setChallengeKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportKey, setReportKey] = useState(0)

  // Le titre porté n'a que `topicId:TIER` : son nom vient des titres du sujet.
  const [titleTopicId = '', titleTier] = (data?.equippedTitle ?? '').split(':') as [string?, TierCode?]
  const titleOverview = useTopicOverview(titleTopicId)
  const titleText = titleTier
    ? (titleOverview.data?.titles?.[language]?.[titleTier] ??
      titleOverview.data?.titles?.fr?.[titleTier] ??
      (titleOverview.data ? `${tokens.tier[titleTier].label} · ${topicName(titleOverview.data.topic.names, language)}` : undefined))
    : undefined

  const progression = data?.progression
  const tier = progression && !progression.provisional ? tierOf(progression.rating) : undefined
  const canAct = Boolean(data && !data.isMe && !data.suspended && !data.bot)
  const name = data?.pseudonym ?? t('player.title')
  const latest = finishedGames(games.data?.pages.flatMap((page) => page.content) ?? []).slice(0, 10)
  const played = (head.data?.played ?? 0) > 0

  if (data?.isMe) return <Navigate to={ROUTES.me} replace />

  const openChallenge = () => {
    setChallengeKey((value) => value + 1)
    setChallengeOpen(true)
  }
  const toggleFollow = () => {
    if (data && !follow.isPending) follow.mutate(!data.following)
  }
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.social, { replace: true }))

  return (
    <ParallaxScreen
      heroHeight={HERO_HEIGHT}
      centered
      barTitleStart
      onBack={back}
      image={data?.bannerUrl ?? undefined}
      title={name}
      premium={identity.premium(data)}
      eyebrow={data ? <Avatar name={name} src={src} tier={tier} provisional={progression?.provisional} size="xxl" /> : undefined}
      right={
        data && !data.isMe ? (
          <>
            {!data.bot && <IconButton icon={DotsThreeIcon} label={t('player.more')} media onClick={() => setMenuOpen(true)} />}
          </>
        ) : undefined
      }
      intro={
        data ? (
          <div className="grid gap-4">
            <div className="grid justify-items-center gap-2">
              {titleTier && titleText && (
                <div className="w-full min-w-0 overflow-x-auto">
                  <div className="flex w-max min-w-full justify-center">
                    <TitleRibbon tier={titleTier} text={titleText} width="auto" />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {tier && progression ? (
                  <Badge variant="tier" tier={tier}>{`${tokens.tier[tier].label} · ${formatNumber(progression.rating, language)}`}</Badge>
                ) : (
                  <Pill>{t('profile.unranked')}</Pill>
                )}
                {data.country && <Pill>{`${countryFlag(data.country)} ${countryName(data.country, language)}`}</Pill>}
                {data.suspended && <Pill tone="suspended">{t('player.suspended')}</Pill>}
              </div>
              {!data.suspended && !data.bot && <span className="jo-type-caption text-jo-muted">{presenceLine(data.presence, t)}</span>}
            </div>
            {canAct && (
              <div className="grid grid-cols-[65fr_35fr] gap-2">
                {/* 65 / 35 : le défi est l'action principale (décision du 2026-11-06). */}
                <Button full icon={LightningIcon} variant="filled" tone="accent" onClick={openChallenge}>
                  {t('player.challenge')}
                </Button>
                <Button
                  full
                  icon={data.following ? CheckIcon : undefined}
                  variant={data.following ? 'gray' : 'tinted'}
                  tone={data.following ? 'neutral' : 'accent'}
                  aria-pressed={data.following}
                  onClick={toggleFollow}
                >
                  {t(data.following ? 'player.followed' : 'player.follow')}
                </Button>
              </div>
            )}
          </div>
        ) : undefined
      }
      bottomNav={<TabNav active="social" />}
      overlay={
        data ? (
          <>
            {menuOpen && (
              <div className="absolute inset-0 z-20" onClick={() => setMenuOpen(false)}>
                <Menu
                  width={200}
                  className="absolute top-[calc(var(--jo-safe-top,0px)+52px)] right-3"
                  items={[
                    {
                      label: t('player.report'),
                      icon: FlagIcon,
                      onClick: () => {
                        setReportKey((value) => value + 1)
                        setReportOpen(true)
                      },
                    },
                  ]}
                />
              </div>
            )}
            <ChallengeTopicSheet
              key={challengeKey}
              player={name}
              open={challengeOpen}
              onClose={() => setChallengeOpen(false)}
              onPick={(topic) =>
                challenge.mutate({
                  topic: { topicId: topic.topicId, name: topicName(topic.names, language), category: topic.category ?? undefined },
                  opponent: { userId: data.userId, pseudonym: data.pseudonym },
                })
              }
            />
            <ReportPlayerSheet key={reportKey} open={reportOpen} onClose={() => setReportOpen(false)} userId={data.userId} name={name} subtitle={t('player.reportSubtitle')} />
          </>
        ) : undefined
      }
    >
      {profile.isPending ? (
        <div className="grid gap-6 px-4 pt-1 pb-6" aria-label={t('home.loading')}>
          <Skeleton shape="row" />
          <Skeleton shape="card" />
        </div>
      ) : profile.isError ? (
        <EmptyState
          className="pt-16"
          icon={WarningCircleIcon}
          title={t('player.error')}
          description={t('home.errorText')}
          action={
            <Button loading={profile.isRefetching} onClick={() => void profile.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 px-4 pt-4 pb-8">
          <section className="grid gap-3">
            <SectionHeader title={t('player.headToHead', { name })} />
            {head.isPending ? (
              <Skeleton shape="card" />
            ) : played && head.data ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label={t('profile.wins')} value={formatNumber(head.data.wins, language)} tone="up" compact />
                  <Stat label={t(head.data.draws > 1 ? 'profile.draws' : 'profile.draw')} value={formatNumber(head.data.draws, language)} compact />
                  <Stat label={t('profile.losses')} value={formatNumber(head.data.losses, language)} tone="down" compact />
                </div>
                <div className="rounded-jo-lg bg-jo-surface p-4">
                  <OutcomeBar wins={head.data.wins} draws={head.data.draws} losses={head.data.losses} />
                </div>
              </>
            ) : (
              <EmptyState icon={SwordIcon} title={t('player.noDuelTitle')} description={t('player.noDuelText', { name })} />
            )}
          </section>
          {played && latest.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader
                title={t('profile.lastGames')}
                action={
                  <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.gamesAgainst(userId))}>
                    {t('home.seeAll')}
                  </Button>
                }
              />
              <GameGroups games={latest} />
            </section>
          )}
        </div>
      )}
    </ParallaxScreen>
  )
}
