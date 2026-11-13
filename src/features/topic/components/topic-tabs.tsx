import { customTitle } from '@joutio/client-domain/authoring'
import type { GameHistoryItemView, GameOutcome, LeaderboardEntryView, TopicOverviewView } from '@joutio/client-domain/api-types'
import { SwordIcon, TrophyIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { usePlayerIdentity } from '@/features/me'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Button, EmptyState, MatchRow, PlayerRow, Podium, SectionHeader, Skeleton, TitleRow, tokens, type MatchOutcome } from '@/ui'
import { useMyTitles, useTopicGames, useTopicLeaderboard, useWearTitle } from '../hooks/use-topic'
import { dayLabel, formatNumber, MASTERY_TIERS, MASTERY_XP } from '../lib/format'

const OUTCOMES: Partial<Record<GameOutcome, MatchOutcome>> = { WIN: 'win', LOSS: 'loss', DRAW: 'draw' }

/** Rang à partir duquel la ligne du joueur passe en barre fixe (hors du top 10). */
export const BOARD_TOP = 10

function Rows() {
  return (
    <>
      <Skeleton shape="row" />
      <Skeleton shape="row" />
      <Skeleton shape="row" />
    </>
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

/** Onglet Parties : mes 10 dernières parties du sujet, groupées par jour. */
export function GamesTab({ topicId }: { topicId: string }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const games = useTopicGames(topicId)
  // Parties terminées seulement : une partie en attente ou annulée n'a pas d'issue à montrer.
  const finished = (games.data?.content ?? []).filter((game) => OUTCOMES[game.outcome])
  const groups: { day: string; games: GameHistoryItemView[] }[] = []
  for (const game of finished) {
    const day = dayLabel(new Date(game.playedAt), language, { today: t('topic.today'), yesterday: t('topic.yesterday') })
    const last = groups[groups.length - 1]
    if (last?.day === day) last.games.push(game)
    else groups.push({ day, games: [game] })
  }
  const sub = (game: GameHistoryItemView) =>
    game.opponentType === 'BOT' ? t('topic.training') : game.xp === null ? undefined : `${game.xp >= 0 ? '+' : '−'}${formatNumber(Math.abs(game.xp), language)} XP`

  return (
    <div className="grid gap-4 px-4">
      <SectionHeader
        title={t('topic.lastGames')}
        action={
          <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.myGames(topicId))}>
            {t('home.seeAll')}
          </Button>
        }
      />
      {games.isPending ? (
        <Rows />
      ) : games.isError && !games.data ? (
        <ErrorState title={t('topic.gamesError')} retrying={games.isRefetching} onRetry={() => void games.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState icon={SwordIcon} title={t('topic.noGamesTitle')} description={t('topic.noGamesText')} />
      ) : (
        groups.map((group) => (
          <section key={group.day} className="grid gap-2">
            <span className="jo-type-caption font-semibold text-jo-muted">{group.day}</span>
            <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
              {group.games.map((game, index) => (
                <MatchRow
                  key={game.gameId}
                  topic={game.opponent?.pseudonym ?? t(game.opponentType === 'BOT' ? 'topic.bot' : 'topic.opponent')}
                  category={toCategoryCode(game.topic.category)}
                  sub={sub(game)}
                  outcome={OUTCOMES[game.outcome] ?? 'draw'}
                  score={`${game.myScore} · ${game.opponentScore}`}
                  bot={game.opponentType === 'BOT'}
                  last={index === group.games.length - 1}
                  onClick={() => void navigate(ROUTES.result(game.gameId))}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

/** Ligne du joueur connecté, en barre fixe quand il est hors du top 10. */
export function MyBoardRow({ entry }: { entry: LeaderboardEntryView }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const src = useUserAvatar(entry)
  const identity = usePlayerIdentity()
  return (
    <div className="-mx-4 -my-2">
      <PlayerRow
        highlight
        last
        rank={entry.rank}
        name={entry.pseudonym}
        premium={identity.premium(entry)}
        onClick={identity.open(entry.userId)}
        src={src}
        tier={entry.provisional ? undefined : tierOf(entry.rating)}
        sub={t('topic.totalXp', { xp: formatNumber(entry.totalXp, language) })}
        trail={formatNumber(entry.totalXp, language)}
      />
    </div>
  )
}

/** Ligne de classement avec l'avatar du joueur (ses options DiceBear). */
/** Une ligne ouvre la fiche du joueur (la mienne : le Profil). */
export function BoardRow({ entry, sub, trail, highlight, last }: { entry: LeaderboardEntryView; sub: string; trail: string; highlight: boolean; last: boolean }) {
  const src = useUserAvatar(entry)
  const identity = usePlayerIdentity()
  return (
    <PlayerRow
      rank={entry.rank}
      name={entry.pseudonym}
      premium={identity.premium(entry)}
      src={src}
      tier={entry.provisional ? undefined : tierOf(entry.rating)}
      sub={sub}
      trail={trail}
      highlight={highlight}
      last={last}
      onClick={identity.open(entry.userId)}
    />
  )
}

/** Onglet Classement : Top 10 depuis toujours, podium puis rangs 4 à 10. */
export function BoardTab({ topicId }: { topicId: string }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const board = useTopicLeaderboard(topicId)
  const entries = board.data?.entries.content ?? []
  const [first, second, third, ...rest] = entries
  const podium = [first, second, third].filter((entry): entry is LeaderboardEntryView => entry !== undefined)
  const avatars = [useUserAvatar(first), useUserAvatar(second), useUserAvatar(third)]
  const identity = usePlayerIdentity()
  const sub = (entry: LeaderboardEntryView) => (entry.provisional ? t('topic.provisional') : tokens.tier[tierOf(entry.rating)].label)

  return (
    <div className="grid gap-3 px-4">
      <SectionHeader
        title={t('topic.top10')}
        action={
          <Button variant="plain" size="S" onClick={() => void navigate(ROUTES.topicLeaderboard(topicId))}>
            {t('topic.allRankings')}
          </Button>
        }
      />
      <span className="jo-type-caption text-pretty text-jo-muted">{t('topic.boardLegend')}</span>
      {board.isPending ? (
        <>
          <Skeleton shape="card" />
          <Rows />
        </>
      ) : board.isError && !board.data ? (
        <ErrorState title={t('topic.boardError')} retrying={board.isRefetching} onRetry={() => void board.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState icon={TrophyIcon} title={t('topic.boardEmptyTitle')} description={t('topic.boardEmptyText')} />
      ) : (
        <>
          <Podium
            players={podium.map((entry, index) => ({
              name: entry.pseudonym,
              src: avatars[index],
              tier: entry.provisional ? undefined : tierOf(entry.rating),
              value: formatNumber(entry.totalXp, language),
              premium: identity.premium(entry),
              onOpen: identity.open(entry.userId),
            }))}
          />
          {rest.length > 0 && (
            <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
              {rest.map((entry, index) => (
                <BoardRow
                  key={entry.userId}
                  entry={entry}
                  sub={sub(entry)}
                  trail={formatNumber(entry.totalXp, language)}
                  highlight={entry.userId === board.data?.me?.userId}
                  last={index === rest.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Onglet Progression : les sept titres du sujet et leurs conditions. Un seul porté. */
export function ProgressTab({ overview }: { overview: TopicOverviewView }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const titles = useMyTitles()
  const wear = useWearTitle()
  const { topic, myProgress: progress } = overview
  const name = topicName(topic.names, language)
  const reached = progress ? MASTERY_TIERS.indexOf(progress.tier) : -1
  // Le premier titre demande au moins une partie humaine terminée (`ProfileUpdateService.updateEquippedTitle`).
  const played = (progress?.games ?? 0) > 0
  const label = (tier: (typeof MASTERY_TIERS)[number]) => customTitle(overview.titles, tier, language) ?? `${tokens.tier[tier].label} · ${name}`

  return (
    <div className="grid gap-4 px-4">
      <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
        {MASTERY_TIERS.map((tier, index) => {
          const earned = played && index <= reached
          const key = `${topic.topicId}:${tier}`
          return (
            <TitleRow
              key={tier}
              tier={tier}
              title={label(tier)}
              progress={
                !earned && index === 0
                  ? { value: 0, label: t('topic.oneGameLeft') }
                  : !earned && progress && index > 0
                    ? {
                        value: Math.min(100, (progress.xp / MASTERY_XP[tier]) * 100),
                        label: t('topic.xpLeft', { xp: formatNumber(Math.max(0, MASTERY_XP[tier] - progress.xp), language) }),
                      }
                    : undefined
              }
              locked={!earned}
              worn={titles.data?.equippedKey === key}
              onWear={() => {
                if (!wear.isPending) wear.mutate(titles.data?.equippedKey === key ? null : key)
              }}
              last={index === MASTERY_TIERS.length - 1}
            />
          )
        })}
      </div>
    </div>
  )
}
