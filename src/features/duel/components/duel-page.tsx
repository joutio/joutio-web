import {
  isBonusRound,
  LATE_JOIN_MS,
  MAX_SCORE,
  ROUND_INTRO_MS,
  ROUNDS,
  sortedRounds,
  TRANSITION_GRACE_MS,
  type GameState,
} from '@joutio/client-domain/game'
import { FlagIcon } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useBlocker, useLocation, useNavigate, useParams, type BlockerFunction } from 'react-router-dom'
import { useMe } from '@/features/me'
import { usePlayerProfile, type PlayTopic } from '@/features/play'
import { useTopicOverview } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { readServerNow, useConnectionStore, useServerClock, useServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { useDeviceSettings } from '@/shared/device-settings'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toast, useToastSuppression } from '@/shared/toast'
import { toCategoryCode, topicName } from '@/shared/topics'
import {
  Dialog,
  DuelHeader,
  Logo,
  QuestionBlock,
  ReconnectCountdown,
  RoundIntro,
  ScoreGauge,
  TimerBar,
  tokens,
  VersusIntro,
  type AnswerCardProps,
  type RoundResult,
} from '@/ui'
import { useDuelArena } from '../hooks/use-duel-arena'
import { useGameStream, usePrefetchQuestionImages } from '../hooks/use-game'
import { gameService } from '../lib/game-service'
import { DuelCancelled } from './duel-cancelled'

/** Pastilles des manches, d'après les réponses du joueur. */
function roundResults(game: GameState, userId: string, current: number): RoundResult[] {
  const rounds = sortedRounds(game)
  return Array.from({ length: ROUNDS }, (_, index) => {
    const bonus = isBonusRound(index)
    const round = rounds[index]
    if (round?.phase === 'CLOSED') {
      const correct = round.playerAnswers[userId]?.correct === true
      return bonus ? (correct ? 'bonusCorrect' : 'bonusWrong') : correct ? 'correct' : 'wrong'
    }
    if (index === current) return bonus ? 'bonus' : 'current'
    return bonus ? 'bonus' : 'upcoming'
  })
}

/** Écran toujours sombre, quel que soit le thème (`duel.md` § 1). */
function Dark({ children }: { children: ReactNode }) {
  return (
    <div data-jo-theme="dark" className="relative flex h-full flex-col overflow-hidden bg-jo-bg text-jo-text">
      {children}
    </div>
  )
}

/**
 * Duel (`duel.md`, lab `duel.tsx`) : toujours sombre, sans onglets ni toasts. Le fil est piloté par les seuls instants
 * serveur (`sceneAt` de `@joutio/client-domain`) : face-à-face → manche → question → révélation → … → résultat.
 * Quitter l'écran (retour, lien) pendant la partie ouvre la confirmation d'abandon.
 */
export function DuelPage() {
  const { gameId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const t = useT()
  // Réglages › Icônes et points des réponses (local à l'appareil, désactivé par défaut).
  const answerDetails = useDeviceSettings((state) => state.answerDetails)
  const language = useLanguageStore((state) => state.language)
  useToastSuppression()
  useServerClock()
  const me = useMe().data
  const userId = me?.userId ?? ''
  const passed = (location.state as { topic?: PlayTopic } | null)?.topic
  const stream = useGameStream(gameId)
  const connection = useConnectionStore((state) => state.status)
  const now = useServerNow(100)
  const game = stream.state

  // Sujet : passé par le salon, sinon relu (rechargement de la page).
  const overview = useTopicOverview(passed?.name ? '' : (game?.topicId ?? ''))
  const topic = passed?.name ?? (overview.data ? topicName(overview.data.topic.names, language) : '')
  const category = toCategoryCode(passed?.category ?? overview.data?.topic.category)

  const isPlayer1 = game?.player1Id === userId
  const opponentId = game ? (isPlayer1 ? game.player2Id : game.player1Id) : null
  const vsBot = game?.player2Type === 'BOT'
  const opponentProfile = usePlayerProfile(opponentId ?? '', Boolean(opponentId) && !vsBot)
  const myAvatar = useUserAvatar(me)
  const opponentAvatar = useUserAvatar(vsBot ? null : opponentProfile.data)
  usePrefetchQuestionImages(game?.questionImageUrls ?? [])

  const arena = useDuelArena({
    gameId,
    game: game ?? ({ gameId, rounds: {} } as GameState),
    now,
    serverNow: readServerNow,
    userId,
    language,
    refresh: () => stream.refresh(),
  })
  const scene = arena.scene
  const expired = game?.status === 'CANCELED' && game.canceledReason === 'GAME_EXPIRED'
  // Une partie expirée n'a pas de bilan : elle garde son écran dédié.
  const finished = scene.kind === 'result' && !expired

  // Rattrapage : une transition serveur attendue tarde, ou l'écho de ma réponse : on rejoue l'historique.
  const overdue = 'overdue' in scene && scene.overdue
  useEffect(() => {
    if (overdue || arena.pendingEchoOverdue) stream.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overdue, arena.pendingEchoOverdue])

  // Fin : la scène décide (la révélation finale reste affichée `RESULT_DELAY_MS`) ; le bilan remplace l'arène.
  const leaving = useRef(false)
  useEffect(() => {
    if (!finished || leaving.current) return
    leaving.current = true
    void navigate(ROUTES.result(gameId), { replace: true, state: { celebrate: true, topic: passed ?? (game?.topicId ? { topicId: game.topicId, name: topic, category } : undefined) } })
  }, [finished, gameId, navigate, passed, game?.topicId, topic, category])

  // Abandon : toute sortie de l'écran pendant la partie demande confirmation (retour du navigateur compris).
  const playing = Boolean(game && stream.status?.loaded) && !finished && !expired && game?.status === 'IN_PROGRESS'
  const playingRef = useRef(false)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])
  const block = useCallback<BlockerFunction>(({ currentLocation, nextLocation }) => !leaving.current && playingRef.current && currentLocation.pathname !== nextLocation.pathname, [])
  const blocker = useBlocker(block)
  const abandon = useMutation({
    mutationFn: () => gameService.abandon(gameId),
    onSuccess: () => {
      leaving.current = true
      if (blocker.state === 'blocked') blocker.proceed()
      else void navigate(-1)
    },
    onError: () => toast.error(t('duel.abandonError')),
  })
  const [asking, setAsking] = useState(false)
  const confirmOpen = asking || blocker.state === 'blocked'
  const closeConfirm = () => {
    setAsking(false)
    if (blocker.state === 'blocked') blocker.reset()
  }

  const [introDone, setIntroDone] = useState<number | null>(null)
  const myName = me?.pseudonym ?? ''
  const opponentName = (isPlayer1 ? game?.player2Name : game?.player1Name) ?? (vsBot ? t('duel.bot') : t('topic.opponent'))
  const myTier = me?.progression && !me.progression.provisional ? tierOf(me.progression.rating) : undefined

  if (expired && game) return <DuelCancelled started={game.firstRoundAt !== null} topic={passed ?? (game.topicId ? { topicId: game.topicId, name: topic, category } : undefined)} />

  if (!game || !stream.status?.loaded || finished) {
    return (
      <Dark>
        <div className="grid flex-1 place-items-center">
          <Logo size={32} className="animate-pulse" />
        </div>
      </Dark>
    )
  }

  const reconnecting = connection === 'reconnecting' || connection === 'offline'
  const roundNumber = arena.roundIndex + 1
  const versus = scene.kind === 'vs' || scene.kind === 'swoosh'
  const versusElapsed = scene.kind === 'vs' || scene.kind === 'swoosh' ? scene.elapsedMs : 0
  // L'arène reste montée sous l'intro de manche : l'intro la recouvre puis se retire.
  const inRound = scene.kind === 'question' || scene.kind === 'reveal' || scene.kind === 'roundIntro'
  const revealed = scene.kind === 'reveal'
  const introOpen = scene.kind === 'roundIntro' && introDone !== scene.round
  // Réponses : seulement dans la scène de question (la lecture de 2 s est jouée par l'animation, calée sur
  // `revealAt` du serveur) ou à la révélation, jamais derrière l'intro.
  const answersShown = !introOpen && (scene.kind === 'question' || scene.kind === 'reveal')
  const animateQuestion = !arena.joinedLate || introDone === arena.roundIndex
  const answers: AnswerCardProps[] = arena.answers.map(({ choice, label }) => {
    const mine = arena.yourPick === choice || arena.pendingChoice === choice
    const theirs = revealed && arena.theirPick === choice
    let state: AnswerCardProps['state'] = 'rest'
    if (revealed) state = choice === arena.correctAnswer ? 'correct' : mine || theirs ? 'wrong' : 'unchosen'
    else if (mine) state = arena.yourCorrect === true ? 'correct' : arena.yourCorrect === false ? 'wrong' : 'pending'
    else if (!arena.isAnswerable) state = 'unchosen'
    const notch = mine && theirs ? 'both' : mine ? 'me' : theirs ? 'opp' : 'none'
    return { label, state, notch, onClick: () => arena.handleAnswer(choice) }
  })
  const seconds = Math.max(0, Math.ceil(arena.timeLeftDisplay))
  const timerState = revealed || (scene.kind === 'question' && scene.locked) ? 'frozen' : 'running'
  const gaugeYou = arena.gauge.you === 'idle' ? 'rest' : arena.gauge.you
  const gaugeThem = arena.gauge.them === 'idle' ? 'rest' : arena.gauge.them

  return (
    <Dark>
      {inRound && (
        <div className="flex h-full flex-col pt-[var(--jo-safe-top,0px)]">
          <TimerBar
            seconds={arena.timeLeftDisplay}
            state={timerState}
            first={arena.firstAnswerPctValue === null ? undefined : (arena.firstAnswerPctValue / 100) * 10}
            className="flex-none"
          />
          <DuelHeader
            me={{ name: myName, src: myAvatar, score: arena.myScore, tier: myTier, scoreState: gaugeYou }}
            opponent={{ name: opponentName, src: opponentAvatar, score: arena.theirScore, scoreState: gaugeThem }}
            seconds={seconds}
            timerState={timerState}
            className="flex-none"
          />
          <div className="relative min-h-0 flex-1">
            <ScoreGauge value={arena.myScore} max={MAX_SCORE} state={gaugeYou} label={t('duel.score', { name: myName })} className="absolute inset-y-0 left-0 h-auto" />
            <ScoreGauge value={arena.theirScore} max={MAX_SCORE} state={gaugeThem} label={t('duel.score', { name: opponentName })} className="absolute inset-y-0 right-0 h-auto" />
            <div className="h-full px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">
              <QuestionBlock
                // Remonté à la fin de l'intro : l'énoncé et les réponses se jouent à la première image visible.
                key={`question-${arena.roundIndex}-${introOpen ? 'intro' : 'ready'}`}
                text={arena.questionText}
                meta={t('duel.meta', { topic, round: roundNumber, total: ROUNDS })}
                image={arena.imageUrl ?? undefined}
                answers={answersShown ? answers : undefined}
                details={answerDetails}
                animated={animateQuestion && scene.kind === 'question'}
              />
            </div>
          </div>
        </div>
      )}
      {introOpen && scene.kind === 'roundIntro' && (
        <div className="absolute inset-0">
          <RoundIntro
            key={`intro-${scene.round}`}
            round={scene.round + 1}
            total={ROUNDS}
            topic={topic}
            category={category}
            results={roundResults(game, userId, arena.roundIndex)}
            bonus={scene.bonus}
            // Arrivé en cours d'intro : l'état tenu, sans rejouer l'ouverture.
            animated={scene.elapsedMs <= LATE_JOIN_MS}
            duration={ROUND_INTRO_MS}
            onComplete={() => setIntroDone(scene.round)}
          />
        </div>
      )}
      {versus && (
        <div className="absolute inset-0">
          <VersusIntro
            key="versus"
            me={{ name: myName, src: myAvatar, tier: myTier, detail: myTier && me?.progression ? `${tokens.tier[myTier].label} · ${me.progression.rating}` : undefined }}
            opponent={{ name: opponentName, src: opponentAvatar, detail: vsBot ? t('duel.training') : undefined }}
            topic={topic}
            category={category}
            rounds={ROUNDS}
            animated={versusElapsed <= LATE_JOIN_MS + TRANSITION_GRACE_MS}
          />
        </div>
      )}
      {scene.kind === 'waiting' && (
        <div className="grid flex-1 place-items-center">
          <Logo size={32} className="animate-pulse" />
        </div>
      )}
      {reconnecting && (
        <div className="absolute inset-0 z-10">
          <ReconnectCountdown seconds={inRound && !revealed ? seconds : 0} opponent={opponentName} round={roundNumber} total={ROUNDS} onAbandon={() => setAsking(true)} />
        </div>
      )}
      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        sheet
        tone="danger"
        icon={FlagIcon}
        title={t('duel.abandonTitle')}
        message={t('duel.abandonText', { name: opponentName })}
        actions={[
          { label: t('duel.abandon'), variant: 'tinted', tone: 'destructive', onClick: () => abandon.mutate() },
          { label: t('duel.continue'), variant: 'filled', onClick: closeConfirm },
        ]}
      />
    </Dark>
  )
}
