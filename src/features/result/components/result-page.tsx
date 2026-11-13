import type { MasteryTier } from '@joutio/client-domain/api-types'
import { isBonusRound, ROUNDS, sortedRounds, type GameResultView, type GameRoundState, type GameState } from '@joutio/client-domain/game'
import { FlagIcon, LightningIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMe, usePlayerIdentity } from '@/features/me'
import { useShare } from '@/features/share'
import { useBotDifficulty, usePlayerProfile, useStartMatchmaking, useStartTraining, type PlayTopic } from '@/features/play'
import { formatNumber, MASTERY_TIERS, MASTERY_XP, useMyTitles, useWearTitle } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import {
  Button,
  cn,
  EloSummary,
  EmptyState,
  IconButton,
  Logo,
  MasteryRing,
  Notice,
  RankPromotion,
  ResultHeader,
  ResultPages,
  Screen,
  SwipeHint,
  TitleUnlock,
  tokens,
  UnlockSequence,
  type MatchOutcome,
  type RoundResult,
  type TierCode,
} from '@/ui'
import { useGameHistory, useGameResult, useSendRematch } from '../hooks/use-result'
import { celebrated } from '../lib/celebrated'
import { reviewRoundsOf } from '../lib/review'
import { DuelReview } from './duel-review'
import { ReportPlayerSheet, ReportQuestionSheet } from './report-sheets'

const ORDER = Object.keys(tokens.tier) as TierCode[]
const masteryOf = (xp: number): MasteryTier => MASTERY_TIERS.reduce<MasteryTier>((best, tier) => (xp >= MASTERY_XP[tier] ? tier : best), MASTERY_TIERS[0] as MasteryTier)

type Unlock = { kind: 'rank'; from: TierCode; tier: TierCode } | { kind: 'title'; tier: MasteryTier }

/**
 * Déblocages de la partie, dans l'ordre de la spec (rang, puis titres), déduits du bilan comme sur le mobile : palier
 * d'Elo avant / après, chaque palier de maîtrise franchi. Les badges attendent que le BFF les rattache à la partie
 * (`resultat.md` § 8).
 */
function unlocksOf(result: GameResultView): Unlock[] {
  if (result.botGame) return []
  const unlocks: Unlock[] = []
  const delta = result.eloDelta ?? 0
  // Rang provisoire : pas encore de palier acquis, donc pas de promotion à célébrer.
  if (result.rated && delta > 0 && !result.progression.provisional) {
    const from = tierOf(result.progression.rating - delta)
    const tier = tierOf(result.progression.rating)
    if (from !== tier) unlocks.push({ kind: 'rank', from, tier })
  }
  const { xp, xpGained } = result.topicMastery
  if (xpGained > 0) {
    const before = xp - xpGained
    const reachedBefore = before > 0 ? MASTERY_TIERS.indexOf(masteryOf(before)) : -1
    const reachedNow = MASTERY_TIERS.indexOf(masteryOf(xp))
    for (let index = reachedBefore + 1; index <= reachedNow; index += 1) {
      const tier = MASTERY_TIERS[index]
      if (tier) unlocks.push({ kind: 'title', tier })
    }
  }
  return unlocks
}

function streakOf(game: GameState, playerId: string | null): RoundResult[] {
  const rounds = sortedRounds(game)
  return Array.from({ length: ROUNDS }, (_, index) => {
    const round = rounds[index]
    if (!round || round.phase !== 'CLOSED') return 'unplayed'
    const correct = (playerId ? round.playerAnswers[playerId]?.correct : false) === true
    if (isBonusRound(index)) return correct ? 'bonusCorrect' : 'bonusWrong'
    return correct ? 'correct' : 'wrong'
  })
}

function Loading() {
  return (
    <div className="grid h-full place-items-center bg-jo-bg">
      <Logo size={32} className="animate-pulse" />
    </div>
  )
}

/**
 * Résultat d'un duel (`resultat.md`, lab `resultat.tsx`). Juste après le duel (`celebrate`, une seule fois par partie) :
 * la séquence de déblocages (rang, titres), à balayer, puis le résultat ; ensuite (historique, rechargement, retour),
 * le résultat seul. Bilan et manches sont relus en
 * REST (la partie est terminée) ; seule la récompense est attendue un instant.
 */
export function ResultPage() {
  const { gameId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const t = useT()
  const passed = location.state as { topic?: PlayTopic; celebrate?: boolean } | null
  // Lu une seule fois : la séquence ne se rejoue ni au rechargement, ni au retour arrière, ni depuis l'historique.
  const [celebrate] = useState(() => passed?.celebrate === true && !celebrated.has(gameId))
  useEffect(() => {
    if (passed?.celebrate !== true) return
    celebrated.add(gameId)
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: { ...passed, celebrate: false } })
  }, [gameId, location.pathname, location.search, navigate, passed])
  const history = useGameHistory(gameId)
  const result = useGameResult(gameId, celebrate)

  if (history.isPending || result.isPending) return <Loading />
  if (history.isError || result.isError || !history.data || !result.data) {
    return (
      <div className="grid h-full place-items-center bg-jo-bg px-4">
        <EmptyState
          icon={WarningCircleIcon}
          title={t('result.loadError')}
          description={t('home.errorText')}
          action={
            <Button
              loading={history.isRefetching || result.isRefetching}
              onClick={() => {
                void history.refetch()
                void result.refetch()
              }}
            >
              {t('common.retry')}
            </Button>
          }
        />
      </div>
    )
  }
  return <ResultContent gameId={gameId} game={history.data} data={result.data} passed={passed?.topic} celebrate={celebrate} />
}

type ContentProps = { gameId: string; game: GameState; data: GameResultView; passed?: PlayTopic; celebrate: boolean }

function ResultContent({ gameId, game, data, passed, celebrate }: ContentProps) {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const shareLink = useShare()
  const identity = usePlayerIdentity()
  const userId = me?.userId ?? ''
  const myName = me?.pseudonym ?? ''
  const bot = data.botGame
  const cancelled = game.status === 'CANCELED'
  const opponentId = data.opponentId ?? (game.player1Id === userId ? game.player2Id : game.player1Id)
  const opponentName = data.opponent?.pseudonym ?? (game.player1Id === userId ? game.player2Name : game.player1Name) ?? (bot ? t('duel.bot') : t('topic.opponent'))
  const topic: PlayTopic = { topicId: data.topic.topicId, name: passed?.name ?? topicName(data.topic.names, language), category: passed?.category ?? data.topic.category }
  const outcome: MatchOutcome = game.forfeiterId === userId ? 'forfeit' : data.winnerId === null ? 'draw' : data.winnerId === userId ? 'win' : 'loss'
  const myAvatar = useUserAvatar(me)
  const opponentProfile = usePlayerProfile(opponentId ?? '', Boolean(opponentId) && !bot)
  const opponentAvatar = useUserAvatar(bot ? null : (data.opponent ?? opponentProfile.data))
  const titles = useMyTitles()
  const wear = useWearTitle()
  const training = useStartTraining()
  const matchmaking = useStartMatchmaking()
  const difficulty = useBotDifficulty((state) => state.difficulty)
  const rematch = useSendRematch({ userId, opponentId, topic, gameId })
  const [step, setStep] = useState(0)
  const [sequenceDone, setSequenceDone] = useState(!celebrate)
  // Pages verticales du résultat : 0 le résultat, 1 Détails du duel (`resultat.md` § 6, comme le mobile).
  const [page, setPage] = useState<0 | 1>(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [questionReport, setQuestionReport] = useState<{ round: GameRoundState; index: number; count: number } | null>(null)
  const [reportedRounds, setReportedRounds] = useState<readonly number[]>([])

  // Elo à l'instant de la partie (le bilan), jamais celui du profil courant.
  const rating = data.progression.rating
  const myTier = data.progression.provisional ? undefined : tierOf(rating)
  // `opponentRated` dit seulement que la partie a compté pour son Elo, y compris en période provisoire : le cadre
  // attend un rang acquis (profil non provisoire), comme le mien. Sinon, avatar sans cadre (lab), jamais le Fer.
  const opponentProgression = opponentProfile.data?.progression
  const opponentRanked = Boolean(opponentProgression && !opponentProgression.provisional)
  const opponentTier = data.opponentRated && data.opponentRating != null && opponentRanked ? tierOf(data.opponentRating) : undefined
  const unlocks = celebrate && !sequenceDone ? unlocksOf(data) : []

  const quit = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.topic(topic.topicId), { replace: true }))

  // ─── Séquence de déblocages : un plein écran par déblocage, à balayer ───
  if (unlocks.length > 0) {
    const index = Math.min(step, unlocks.length - 1)
    const current = unlocks[index]
    const last = index === unlocks.length - 1
    const share = () => {
      const text = current?.kind === 'rank' ? t('result.shareRank', { tier: tokens.tier[current.tier].label }) : t('result.shareTitle', { topic: topic.name })
      // Lien universel du sujet, avec le code de parrainage du joueur (`partage.md` § 4).
      shareLink({ kind: 'topic', id: topic.topicId, title: t('profile.share'), text })
    }
    const slideOf = (unlock: Unlock): ReactNode => {
      if (unlock.kind === 'rank') {
        const next = ORDER[ORDER.indexOf(unlock.tier) + 1]
        return (
          <RankPromotion
            from={unlock.from}
            tier={unlock.tier}
            next={next}
            name={myName}
            src={myAvatar}
            text={t('result.rankText')}
            nextRule={next ? t('result.rankNext', { elo: formatNumber(tokens.tier[next].minElo, language) }) : undefined}
          />
        )
      }
      const key = `${topic.topicId}:${unlock.tier}`
      const next = MASTERY_TIERS[MASTERY_TIERS.indexOf(unlock.tier) + 1]
      const name = data.topic.titles?.[language]?.[unlock.tier] ?? data.topic.titles?.fr?.[unlock.tier] ?? `${tokens.tier[unlock.tier as TierCode].label} · ${topic.name}`
      return (
        <TitleUnlock
          tier={unlock.tier as TierCode}
          title={name}
          topic={topic.name}
          text={t('result.titleText')}
          next={next as TierCode | undefined}
          nextRule={next ? t('result.titleNext', { xp: formatNumber(MASTERY_XP[next], language) }) : undefined}
          worn={titles.data?.equippedKey === key}
          onWear={() => wear.mutate(key)}
        />
      )
    }
    return (
      <UnlockSequence
        step={index}
        steps={unlocks.length}
        last={last}
        slides={unlocks.map(slideOf)}
        onStepChange={setStep}
        onContinue={() => (last ? setSequenceDone(true) : setStep(index + 1))}
        onSkip={() => setSequenceDone(true)}
        onShare={share}
      />
    )
  }

  // ─── Résultat ───
  const next = myTier ? ORDER[ORDER.indexOf(myTier) + 1] : undefined
  const nextElo = next
    ? tokens.tier[next].minElo > rating
      ? t('result.nextEloLeft', { tier: tokens.tier[next].label, elo: formatNumber(tokens.tier[next].minElo, language), left: formatNumber(tokens.tier[next].minElo - rating, language) })
      : t('result.nextElo', { tier: tokens.tier[next].label, elo: formatNumber(tokens.tier[next].minElo, language) })
    : undefined
  const mastery = data.topicMastery
  const hasReview = !cancelled && reviewRoundsOf(game).length > 0
  const canReport = !bot && !cancelled && Boolean(opponentId) && !data.opponentDeleted
  const botLevel = t(data.botDifficulty === 'EASY' ? 'result.botEasy' : data.botDifficulty === 'HARD' ? 'result.botHard' : 'result.botNormal')

  return (
    <Screen
      overlay={
        <>
          {hasReview && (
            <ReportQuestionSheet
              key={questionReport ? `question-${questionReport.index}` : 'question'}
              open={questionReport !== null}
              onClose={() => setQuestionReport(null)}
              questionId={questionReport?.round.questionId ?? null}
              gameId={gameId}
              hasImage={Boolean(questionReport?.round.imageUrl)}
              subtitle={questionReport ? t('result.questionOf', { index: questionReport.index + 1, total: questionReport.count }) : ''}
              onSent={() => questionReport && setReportedRounds([...reportedRounds, questionReport.index])}
            />
          )}
          {canReport && opponentId && (
            <ReportPlayerSheet
              key={String(reportOpen)}
              open={reportOpen}
              onClose={() => setReportOpen(false)}
              userId={opponentId}
              name={opponentName}
              gameId={gameId}
              subtitle={t('result.reportContext', { topic: topic.name })}
            />
          )}
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[52px] flex-none items-center justify-between px-2">
          <div className="flex gap-1">
            {canReport && <IconButton icon={FlagIcon} label={t('result.reportPlayer', { name: opponentName })} variant="plain" tone="neutral" onClick={() => setReportOpen(true)} />}
          </div>
          <IconButton icon={XIcon} label={t('result.quit')} variant="plain" tone="neutral" onClick={quit} />
        </div>
        <div className="min-h-0 flex-1">
        <ResultPages page={page} onPageChange={setPage} enabled={hasReview}>
        <div className={cn('flex h-full flex-col', !hasReview && 'pb-[calc(var(--jo-safe-bottom,0px)+8px)]')}>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 px-4 pb-2">
          <ResultHeader
            outcome={cancelled ? 'draw' : outcome}
            topic={topic.name}
            me={{
              name: myName,
              src: myAvatar,
              tier: myTier,
              score: data.myScore,
              streak: streakOf(game, userId),
              meta: bot ? t('result.unranked', { elo: formatNumber(rating, language) }) : undefined,
              premium: me?.premium === true,
              onOpen: identity.open(userId),
            }}
            opponent={{
              name: opponentName,
              src: opponentAvatar,
              tier: opponentTier,
              score: data.opponentScore,
              streak: streakOf(game, opponentId),
              meta: bot ? botLevel : undefined,
              premium: !bot && identity.premium(data.opponent ?? opponentProfile.data, opponentId),
              // Le robot et un compte supprimé n'ont pas de fiche.
              onOpen: bot || data.opponentDeleted ? undefined : identity.open(opponentId),
            }}
          />
          {bot || cancelled ? (
            <Notice tone="training" title={t(cancelled ? 'result.cancelled' : 'result.training')} message={t(cancelled ? 'result.cancelledText' : 'result.trainingText')} />
          ) : (
            <>
              <EloSummary elo={rating} delta={data.rated ? (data.eloDelta ?? 0) : 0} next={nextElo} />
              <MasteryRing
                tier={tokens.tier[mastery.tier as TierCode]?.label ?? '—'}
                next={mastery.nextTier ? tokens.tier[mastery.nextTier as TierCode]?.label : undefined}
                gained={mastery.xpGained}
                remaining={mastery.tierRemainingXp}
                size={150}
                state={data.reward === null ? 'pending' : 'done'}
              />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            {bot ? (
              <Button full icon={LightningIcon} loading={training.isPending} onClick={() => training.mutate({ topic, difficulty })}>
                {t('result.replay')}
              </Button>
            ) : (
              <Button full icon={LightningIcon} loading={rematch.sending} disabled={rematch.state !== 'idle' || !opponentId || data.opponentDeleted} onClick={() => void rematch.send()}>
                {rematch.state === 'pending' && rematch.seconds > 0
                  ? t('result.rematchWaiting', { seconds: rematch.seconds })
                  : rematch.state === 'refused'
                    ? t('result.rematchRefused')
                    : t('result.rematch')}
              </Button>
            )}
            <Button variant="gray" tone="neutral" full loading={matchmaking.isPending} onClick={() => matchmaking.mutate(topic)}>
              {t('result.newOpponent')}
            </Button>
          </div>
        </div>
        {/* Bandeau : annonce la page Détails du duel ; un tap y descend, comme le glissé vers le haut. */}
        {hasReview && (
          <SwipeHint
            direction="up"
            title={t('result.details')}
            hint={t('result.swipeUp')}
            label={t('result.openDetails')}
            onClick={() => setPage(1)}
            className="flex-none pt-3 pb-[calc(var(--jo-safe-bottom,0px)+12px)]"
          />
        )}
        </div>
        {hasReview ? (
          <DuelReview
            game={game}
            me={userId}
            myName={myName}
            opponentName={opponentName}
            onBack={() => setPage(0)}
            reported={reportedRounds}
            onReport={(round, index, count) => setQuestionReport({ round, index, count })}
          />
        ) : null}
        </ResultPages>
        </div>
      </div>
    </Screen>
  )
}
