import { localizedQuestion, type GameRoundState, type GameState } from '@joutio/client-domain/game'
import { CaretLeftIcon, CaretRightIcon, CheckIcon, FlagIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { useLanguageStore, useT } from '@/lib/i18n'
import { AnswerTimingRow, Button, Carousel, IconButton, MobileSheet, PageDots, QuestionBlock, RoundReviewTabs, type AnswerCardProps, type ReviewAnswer } from '@/ui'
import { reviewRoundsOf } from '../lib/review'
import { ReportQuestionSheet } from './report-sheets'

const answerOf = (round: GameRoundState, playerId: string | null): ReviewAnswer => {
  const answer = playerId ? round.playerAnswers[playerId] : undefined
  if (!answer) return 'none'
  return answer.correct ? 'correct' : 'wrong'
}

type PageProps = { round: GameRoundState; me: string; opponent: string | null; myName: string; opponentName: string; language: string }

/** Une manche rejouée : qui a répondu, en combien de temps, et les réponses révélées. Pseudonymes, jamais « toi ». */
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
    <div className="flex min-h-full flex-col gap-3 px-4 pb-2">
      <AnswerTimingRow
        first={first}
        me={{ name: myName, seconds: mine ? mine.timeMs / 1000 : undefined, points: mine?.points ?? 0 }}
        opponent={{ name: opponentName, seconds: theirs ? theirs.timeMs / 1000 : undefined, points: theirs?.points ?? 0 }}
      />
      {/* Hauteur plancher : sur un écran court, la manche défile au lieu d'écraser l'image et les réponses. */}
      <div className="flex min-h-[420px] flex-1">
        <QuestionBlock text={questionText} image={round.imageUrl ?? undefined} answers={cards} />
      </div>
    </div>
  )
}

export type DuelReviewProps = {
  open: boolean
  onClose: () => void
  game: GameState
  me: string
  myName: string
  opponentName: string
}

/**
 * Détails du duel (`resultat.md` § 6, lab `resultat.tsx`) : feuille haute (Vaul), onglets des manches, page par manche à balayer (Embla, chaque manche défile si elle dépasse),
 * flèches et « Signaler la question » (aussi à l'entraînement : on signale la question, pas l'adversaire). La manche
 * consultée est gardée d'une ouverture à l'autre ; les images sont préchargées dès le résultat.
 */
export function DuelReview({ open, onClose, game, me, myName, opponentName }: DuelReviewProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const rounds = useMemo(() => reviewRoundsOf(game), [game])
  const opponent = game.player1Id === me ? game.player2Id : game.player1Id
  const [index, setIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState<readonly number[]>([])

  useEffect(() => {
    for (const url of new Set(rounds.map((round) => round.imageUrl).filter(Boolean))) {
      const image = new Image()
      image.src = url as string
    }
  }, [rounds])

  const count = rounds.length
  if (count === 0) return null
  const round = rounds[index]
  const done = reported.includes(index)
  const tabs = rounds.map((item) => ({ me: answerOf(item, me), opponent: answerOf(item, opponent), points: item.playerAnswers[me]?.points ?? 0 }))

  return (
    <>
      {/* Tant que le signalement est empilé, Échap et le voile ne ferment que lui. */}
      <MobileSheet
        open={open}
        onClose={reportOpen ? () => setReportOpen(false) : onClose}
        title={t('result.details')}
        tall
        footer={
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <IconButton icon={CaretLeftIcon} label={t('result.previous')} variant="gray" tone="neutral" disabled={index === 0} onClick={() => setIndex(index - 1)} />
              <PageDots count={count} index={index} />
              <IconButton icon={CaretRightIcon} label={t('result.next')} variant="gray" tone="neutral" disabled={index >= count - 1} onClick={() => setIndex(index + 1)} />
            </div>
            <Button variant="plain" tone="neutral" size="M" full icon={done ? CheckIcon : FlagIcon} disabled={done} onClick={() => setReportOpen(true)}>
              {done ? t('result.questionReported') : t('result.reportQuestion')}
            </Button>
          </div>
        }
      >
        <div className="flex h-full flex-col gap-3">
          <RoundReviewTabs rounds={tabs} value={index} onChange={setIndex} />
          <Carousel
            label={t('result.details')}
            className="-mx-4 flex-1"
            index={index}
            onIndexChange={setIndex}
            slides={rounds.map((item) => (
              <ReviewPage key={item.round} round={item} me={me} opponent={opponent} myName={myName} opponentName={opponentName} language={language} />
            ))}
          />
        </div>
      </MobileSheet>
      <ReportQuestionSheet
        key={`${index}-${reportOpen}`}
        open={open && reportOpen}
        onClose={() => setReportOpen(false)}
        questionId={round?.questionId ?? null}
        gameId={game.gameId}
        hasImage={Boolean(round?.imageUrl)}
        subtitle={t('result.questionOf', { index: index + 1, total: count })}
        onSent={() => setReported([...reported, index])}
      />
    </>
  )
}
