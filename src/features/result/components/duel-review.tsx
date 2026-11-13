import { localizedQuestion, type GameRoundState, type GameState } from '@joutio/client-domain/game'
import { CheckIcon, FlagIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { useLanguageStore, useT } from '@/lib/i18n'
import { AnswerTimingRow, Button, PageDots, QuestionBlock, RoundReviewTabs, SwipeHint, TabsScrollView, type AnswerCardProps, type ReviewAnswer } from '@/ui'
import { reviewRoundsOf } from '../lib/review'

const answerOf = (round: GameRoundState, playerId: string | null): ReviewAnswer => {
  const answer = playerId ? round.playerAnswers[playerId] : undefined
  if (!answer) return 'none'
  return answer.correct ? 'correct' : 'wrong'
}

type PageProps = { round: GameRoundState; me: string; opponent: string | null; myName: string; opponentName: string; language: string }

/**
 * Une manche rejouée : qui a répondu, en combien de temps, puis la question avec les mêmes ratios que le duel (image
 * réduite à la place disponible, réponses en 2 × 2), comme le lab et le mobile. Pseudonymes, jamais « toi ».
 */
function ReviewPage({ round, me, opponent, myName, opponentName, language }: PageProps) {
  const { questionText, answers } = localizedQuestion(round, language)
  const mine = round.playerAnswers[me]
  const theirs = opponent ? round.playerAnswers[opponent] : undefined
  const first = mine && (!theirs || mine.timeMs <= theirs.timeMs) ? 'me' : theirs ? 'opponent' : undefined
  const cards: AnswerCardProps[] = Object.keys(answers)
    .sort()
    .map((choice) => {
      const isMine = mine?.choice === choice
      const isTheirs = theirs?.choice === choice
      return {
        label: answers[choice] ?? '',
        state: choice === round.correctAnswer ? 'correct' : isMine || isTheirs ? 'wrong' : 'unchosen',
        notch: isMine && isTheirs ? 'both' : isMine ? 'me' : isTheirs ? 'opp' : 'none',
      }
    })
  return (
    <div className="flex h-full flex-col gap-3 px-4">
      <AnswerTimingRow
        first={first}
        me={{ name: myName, seconds: mine ? mine.timeMs / 1000 : undefined, points: mine?.points ?? 0 }}
        opponent={{ name: opponentName, seconds: theirs ? theirs.timeMs / 1000 : undefined, points: theirs?.points ?? 0 }}
      />
      <div className="min-h-0 flex-1">
        <QuestionBlock text={questionText} image={round.imageUrl ?? undefined} layout="2x2" answers={cards} />
      </div>
    </div>
  )
}

export type DuelReviewProps = {
  game: GameState
  me: string
  myName: string
  opponentName: string
  /** Remonte au résultat (miroir du bandeau « Détails du duel »). */
  onBack: () => void
  /** Manches déjà signalées (indices). */
  reported: readonly number[]
  /** Ouvre le signalement de la manche affichée : la feuille vit hors du pager, qui est translaté. */
  onReport: (round: GameRoundState, index: number, count: number) => void
}

/**
 * Détails du duel (`resultat.md` § 6) : seconde page verticale du résultat, comme `joutio-mobile` (écart assumé avec
 * la feuille du lab). Miroir (caret seul), titre, onglets des manches, page par manche à balayer (défilement natif
 * aimanté, comme le lab),
 * flèches et points, « Signaler la question » (aussi à l'entraînement). Montée avec le résultat : la manche consultée
 * est gardée d'une page à l'autre et les images sont préchargées.
 */
export function DuelReview({ game, me, myName, opponentName, onBack, reported, onReport }: DuelReviewProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const rounds = useMemo(() => reviewRoundsOf(game), [game])
  const opponent = game.player1Id === me ? game.player2Id : game.player1Id
  const [index, setIndex] = useState(0)

  useEffect(() => {
    for (const url of new Set(rounds.map((round) => round.imageUrl).filter(Boolean))) {
      const image = new Image()
      image.src = url as string
    }
  }, [rounds])

  const pages = useMemo(
    () =>
      rounds.map((item, page) => ({
        value: String(page),
        content: <ReviewPage round={item} me={me} opponent={opponent} myName={myName} opponentName={opponentName} language={language} />,
      })),
    [rounds, me, opponent, myName, opponentName, language],
  )

  const count = rounds.length
  if (count === 0) return null
  const round = rounds[index]
  const done = reported.includes(index)
  const tabs = rounds.map((item) => ({ me: answerOf(item, me), opponent: answerOf(item, opponent), points: item.playerAnswers[me]?.points ?? 0 }))

  return (
    <div className="flex h-full flex-col gap-3 pb-[calc(var(--jo-safe-bottom,0px)+8px)]">
      <SwipeHint direction="down" label={t('result.backToResult')} onClick={onBack} className="flex-none pt-1 pb-1" />
      <div className="grid flex-none gap-3 px-4">
        <h2 className="jo-type-headline m-0">{t('result.details')}</h2>
        <RoundReviewTabs rounds={tabs} value={index} onChange={setIndex} />
      </div>
      <TabsScrollView contained className="min-h-0 flex-1" value={String(index)} onChange={(value) => setIndex(Number(value))} pages={pages} />
      <div className="grid flex-none gap-1 px-4">
        {/* Sans flèches (2026-11-13) : on balaie, ou on touche un onglet de manche. */}
        <div className="flex items-center justify-center py-2">
          <PageDots count={count} index={index} />
        </div>
        <Button variant="plain" tone="neutral" size="M" full icon={done ? CheckIcon : FlagIcon} disabled={done} onClick={() => round && onReport(round, index, count)}>
          {done ? t('result.questionReported') : t('result.reportQuestion')}
        </Button>
      </div>
    </div>
  )
}
