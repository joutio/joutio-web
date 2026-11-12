import type { Language } from '@joutio/client-domain/api-types'
import {
  contentFor,
  QUESTION_CHOICES,
  reasonCounts,
  snapshotDiffers,
  type OwnerQuestionReport,
  type QuestionEditorView,
  type ReportedQuestion,
  type ReportSnapshot,
} from '@joutio/client-domain/authoring'
import { CheckCircleIcon, ClockCounterClockwiseIcon, PencilSimpleIcon, ProhibitIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { useBack } from '@/shared/use-back'
import { Button, Carousel, cn, DetentSheet, EmptyState, MobileTopBar, Pill, QuestionBlock, Screen, Segmented, Skeleton, type Detent } from '@/ui'
import { useDismissReports, useReportQueue, useTopicQuestions, useWorkshop } from '../hooks/use-workshop'
import { questionNumber } from '../lib/workshop-service'
import { REASON_LABEL } from '../lib/labels'

type Version = 'current' | 'reported'

/** Contenu signalé à comparer : celui du signalement ciblé, sinon du plus récent qui en porte un. */
const snapshotOf = (reports: readonly OwnerQuestionReport[], highlight?: string | null) =>
  (reports.find((report) => report.reportId === highlight && report.snapshot) ?? reports.find((report) => report.snapshot))?.snapshot ?? null

function ReportCard({ report, highlighted }: { report: OwnerQuestionReport; highlighted: boolean }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  return (
    <article className={cn('grid gap-2 rounded-jo-lg bg-jo-raised p-4', highlighted && 'ring-2 ring-jo-accent ring-inset')} aria-current={highlighted ? 'true' : undefined}>
      {highlighted && <span className="jo-type-caption font-semibold text-jo-accent-ink">{t('workshop.reportFromNotification')}</span>}
      <div className="flex flex-wrap gap-1.5">
        {report.reasons.map((reason) => (
          <Pill key={reason} tone="wrong">
            {t(REASON_LABEL[reason])}
          </Pill>
        ))}
      </div>
      {report.comment ? <p className="jo-type-body m-0 text-pretty">« {report.comment} »</p> : <p className="jo-type-callout m-0 text-jo-muted">{t('workshop.noComment')}</p>}
      <span className="jo-type-caption text-jo-muted">
        {report.language ? `${report.language === 'en' ? 'English' : 'Français'} · ` : ''}
        {new Date(report.createdAt).toLocaleDateString(language, { day: 'numeric', month: 'short' })}
      </span>
    </article>
  )
}

/** Une page de la file : la question telle qu'en partie, actuelle ou au moment du signalement. */
function QuestionPage({ question, number, snapshot, peek }: { question: QuestionEditorView; number: number; snapshot: ReportSnapshot | null; peek: number }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language) as Language
  const content = contentFor(question, (snapshot?.language as Language | null) ?? language) ?? contentFor(question, 'fr')
  const answers = snapshot?.answers.length ? snapshot.answers : (content?.answers ?? [])
  const correct = snapshot?.correctAnswer ?? question.correctAnswer
  return (
    <div className="flex min-h-full flex-col gap-3 px-4 pt-2" style={{ paddingBottom: peek + 12 }}>
      <div className="flex items-center justify-between gap-2">
        <span className="jo-type-headline">{number > 0 ? t('workshop.questionNumber', { number }) : t('workshop.question')}</span>
        {question.status === 'SUSPENDED' ? (
          <Pill tone="suspended" icon={ProhibitIcon}>
            {t('workshop.suspended')}
          </Pill>
        ) : (
          <Pill tone="correct" icon={CheckCircleIcon}>
            {t('workshop.inPlay')}
          </Pill>
        )}
      </div>
      {/* Hauteur plancher : sur un écran court, la question défile au lieu d'écraser l'image et les réponses. */}
      <div className="flex min-h-[420px] flex-1">
        <QuestionBlock
          text={snapshot?.questionText ?? content?.text ?? ''}
          image={(snapshot ? snapshot.imageUrl : question.imageUrl) ?? undefined}
          answers={QUESTION_CHOICES.map((choice) => ({ label: answers.find((answer) => answer.choice === choice)?.text ?? '', state: choice === correct ? ('correct' as const) : ('rest' as const) }))}
        />
      </div>
    </div>
  )
}

/**
 * Signalements d'une question (`creation.md`, Signalements d'une question, lab `question-reports.tsx`) : file de tri
 * sans bottom nav. La question en plein écran, telle que les joueurs la voient, et ses signalements ouverts dans une
 * feuille à crans ; on balaie entre les questions signalées du sujet. Clore (confirmé) ou Modifier traitent tous les
 * signalements ouverts. Depuis une notification : feuille au cran `half`, signalement cerclé.
 */
export function QuestionReportsPage() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const language = useLanguageStore((state) => state.language)
  const { topicId = '', questionId = '' } = useParams()
  const [params] = useSearchParams()
  const highlight = params.get('highlight')
  const fromNotifications = (location.state as { from?: string } | null)?.from === 'notifications'
  const back = useBack(ROUTES.topicModeration(topicId, 'reports'))
  const { topic } = useWorkshop(topicId)
  const questions = useTopicQuestions(topicId)
  const queue = useReportQueue(topicId)
  const dismiss = useDismissReports(topicId)
  const [current, setCurrent] = useState(questionId)
  const [detent, setDetent] = useState<Detent>(highlight ? 'half' : 'peek')
  const [version, setVersion] = useState<Version>('current')
  const [peek, setPeek] = useState(200)
  // La question ouverte reste consultable une fois traitée, si elle était seule (notification déjà traitée).
  const [kept] = useState(questionId)

  const all = questions.data ?? []
  const listed: ReportedQuestion[] = queue.data ?? []
  const orphan = all.find((question) => question.questionId === kept)
  const entries: ReportedQuestion[] = listed.length > 0 || !orphan ? listed : [{ question: orphan, reports: [], history: null }]
  const index = Math.max(0, entries.findIndex((entry) => entry.question.questionId === current))
  const item = entries[index]
  const title = topic ? topicName(topic.names, language) : ''
  const position = entries.length > 1 ? ` · ${index + 1} / ${entries.length}` : ''
  const header = (subtitle: string) => <MobileTopBar variant="inline" back={t(fromNotifications ? 'home.notifications' : 'workshop.moderation')} title={t('workshop.reports')} subtitle={subtitle} onBack={back} />

  if (queue.isPending || questions.isPending)
    return (
      <Screen header={header(title)}>
        <div className="grid gap-3 p-4">
          <Skeleton shape="card" className="h-64" />
          <Skeleton shape="row" />
        </div>
      </Screen>
    )
  if (!item)
    return (
      <Screen header={header(title)}>
        <EmptyState className="pt-16" icon={CheckCircleIcon} title={t('workshop.allDone')} description={t('workshop.allDoneText')} action={<Button onClick={back}>{t('workshop.back')}</Button>} />
      </Screen>
    )

  const open = item.reports.filter((report) => report.status === 'OPEN')
  const counts = reasonCounts(open)
  const snapshot = snapshotOf(item.reports, highlight)
  const differs = snapshotDiffers(item.question, snapshot)
  const history = item.history
  const historyDate = history?.lastReviewedAt ? new Date(history.lastReviewedAt).toLocaleDateString(language, { day: 'numeric', month: 'short' }) : null
  const historyLast = history ? t(history.lastStatus === 'RESOLVED' ? 'workshop.historyResolved' : 'workshop.historyDismissed', { date: historyDate ?? '' }).trim() : null
  const select = (id: string) => {
    setCurrent(id)
    setVersion('current')
    setDetent('peek')
  }
  const confirmClose = () =>
    showDialog({
      sheet: true,
      icon: CheckCircleIcon,
      title: t(open.length > 1 ? 'workshop.closeTitleMany' : 'workshop.closeTitleOne', { count: open.length }),
      message: t('workshop.closeText'),
      actions: [
        {
          label: t('workshop.closeConfirm'),
          variant: 'filled',
          onClick: () => {
            const next = entries[index + 1] ?? entries[index - 1]
            dismiss.mutate(item.question.questionId)
            if (next) select(next.question.questionId)
          },
        },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  return (
    <Screen
      header={
        <>
          {header(`${title}${position}`)}
          {differs && (
            <div className="px-4 pt-1 pb-2">
              <Segmented
                label={t('workshop.version')}
                value={version}
                onChange={setVersion}
                options={[
                  { value: 'current', label: t('workshop.versionCurrent') },
                  { value: 'reported', label: t('workshop.versionReported') },
                ]}
              />
            </div>
          )}
        </>
      }
      overlay={
        <DetentSheet
          label={t('workshop.reportsOfQuestion')}
          detent={detent}
          onDetentChange={setDetent}
          onPeekHeight={setPeek}
          locked={open.length === 0}
          header={
            <div className="grid gap-2">
              <strong className="jo-type-headline">{open.length > 0 ? t(open.length > 1 ? 'workshop.openMany' : 'workshop.openOne', { count: open.length }) : t('workshop.reportsDone')}</strong>
              {history && history.closedCount > 0 && historyLast && (
                <span className="jo-type-caption flex items-center gap-1 text-jo-muted">
                  <ClockCounterClockwiseIcon size={14} aria-hidden />
                  {open.length > 0 ? t('workshop.historyCount', { count: history.closedCount, last: historyLast }) : historyLast.charAt(0).toUpperCase() + historyLast.slice(1)}
                </span>
              )}
              {counts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {counts.map(([reason, count]) => (
                    <Pill key={reason} tone="wrong">
                      {t(REASON_LABEL[reason])} · {count}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          }
          footer={
            open.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <Button full variant="gray" tone="neutral" onClick={confirmClose}>
                  {t('workshop.close')}
                </Button>
                <Button
                  full
                  icon={PencilSimpleIcon}
                  onClick={() => void navigate(ROUTES.questionEditor(topicId, item.question.questionId, true), { state: { number: questionNumber(all, item.question.questionId) } })}
                >
                  {t('workshop.edit')}
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="grid gap-3 pt-1">
            {open.map((report) => (
              <ReportCard key={report.reportId} report={report} highlighted={report.reportId === highlight} />
            ))}
          </div>
        </DetentSheet>
      }
    >
      <Carousel
        label={t('workshop.reports')}
        className="h-full"
        index={index}
        onIndexChange={(next) => {
          const entry = entries[next]
          if (entry && entry.question.questionId !== item.question.questionId) select(entry.question.questionId)
        }}
        slides={entries.map((entry) => (
          <QuestionPage
            key={entry.question.questionId}
            question={entry.question}
            number={questionNumber(all, entry.question.questionId)}
            snapshot={entry === item && version === 'reported' ? snapshot : null}
            peek={peek}
          />
        ))}
      />
    </Screen>
  )
}
