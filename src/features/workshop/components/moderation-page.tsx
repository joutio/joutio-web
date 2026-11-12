import { contentFor, MAX_REJECT, QUESTION_CHOICES, questionText, type QuestionEditorView, type ReportedQuestion } from '@joutio/client-domain/authoring'
import { CheckCircleIcon, ProhibitIcon, WarningIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useLanguageStore, useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { useBack } from '@/shared/use-back'
import { Button, EmptyState, FeedFooter, Field, JoutioTabs, ListRow, MobileSheet, MobileTopBar, ModerationCard, Screen, Skeleton, StickyBar, TabsScrollView } from '@/ui'
import { useModerateQuestion, useReportQueue, useTeam, useTopicQuestions } from '../hooks/use-workshop'
import { questionNumber } from '../lib/workshop-service'
import { REASON_LABEL } from '../lib/labels'

type Tab = 'pending' | 'reports'
const PAGE = 20

/**
 * Modération (`creation.md` § 1, lab `Moderation`) : À valider / Signalements, balayables, onglets collés en haut.
 * Approuver retire la question de la file, Rejeter demande un motif, Modifier ouvre l'éditeur. Une ligne de
 * signalement ouvre la file des Signalements sur sa question. 20 par page dans chaque onglet.
 */
export function ModerationPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const { topicId = '' } = useParams()
  const [params] = useSearchParams()
  const back = useBack(ROUTES.myTopic(topicId))
  const me = useMe().data
  const questions = useTopicQuestions(topicId)
  const queue = useReportQueue(topicId)
  const team = useTeam(topicId)
  const moderate = useModerateQuestion(topicId)
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'reports' ? 'reports' : 'pending')
  const [pendingPages, setPendingPages] = useState(1)
  const [reportPages, setReportPages] = useState(1)
  const [rejecting, setRejecting] = useState<string>()
  const [reason, setReason] = useState('')

  const all = questions.data ?? []
  const pending = all.filter((question) => question.status === 'PENDING' || question.status === 'SUSPENDED')
  const listed = queue.data ?? []
  const shownPending = pending.slice(0, pendingPages * PAGE)
  const shownReports = listed.slice(0, reportPages * PAGE)
  const author = (question: QuestionEditorView) =>
    question.creatorId === me?.userId ? (me?.pseudonym ?? '') : (team.data?.find((member) => member.userId === question.creatorId)?.pseudonym ?? t('workshop.roleWriter'))
  const answersOf = (question: QuestionEditorView) => {
    const content = contentFor(question, language) ?? contentFor(question, 'fr')
    return QUESTION_CHOICES.map((choice) => content?.answers.find((answer) => answer.choice === choice)?.text ?? '')
  }
  const reportSub = (item: ReportedQuestion) => {
    const reasons = [...new Set(item.reports.flatMap((report) => report.reasons))].map((value) => t(REASON_LABEL[value])).join(' · ')
    const count = t(item.reports.length > 1 ? 'workshop.reportsMany' : 'workshop.reportsOne', { count: item.reports.length })
    return `${item.question.status === 'SUSPENDED' ? `${t('workshop.suspended')} · ` : ''}${reasons} · ${count}`
  }
  const edit = (question: QuestionEditorView) => void navigate(ROUTES.questionEditor(topicId, question.questionId), { state: { number: questionNumber(all, question.questionId) } })
  const loading = (
    <div className="grid content-start gap-3 px-4">
      <Skeleton shape="card" className="h-40" />
      <Skeleton shape="card" className="h-40" />
    </div>
  )

  return (
    <Screen
      header={<MobileTopBar variant="inline" back={t('workshop.topic')} title={t('workshop.moderation')} onBack={back} />}
      overlay={
        <MobileSheet
          open={rejecting !== undefined}
          onClose={() => setRejecting(undefined)}
          title={t('workshop.rejectTitle')}
          footer={
            <Button
              full
              variant="tinted"
              tone="destructive"
              disabled={reason.trim() === ''}
              onClick={() => {
                if (rejecting) moderate.mutate({ questionId: rejecting, decision: 'reject', reason: reason.trim() })
                setRejecting(undefined)
              }}
            >
              {t('workshop.reject')}
            </Button>
          }
        >
          <Field
            label={t('workshop.rejectReason')}
            placeholder={t('workshop.rejectPlaceholder')}
            multiline
            value={reason}
            maxLength={MAX_REJECT}
            counter={`${reason.length} / ${MAX_REJECT}`}
            onChange={(event) => setReason(event.target.value)}
          />
        </MobileSheet>
      }
    >
      <div className="flex min-h-full flex-col">
        <StickyBar className="flex-none px-4 pt-1 pb-3">
          <JoutioTabs
            label={t('workshop.moderation')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'pending', label: t('workshop.toValidate', { count: pending.length }) },
              { value: 'reports', label: t('workshop.reportsTab', { count: listed.length }) },
            ]}
          />
        </StickyBar>
        <div className="min-h-0 flex-1">
          <TabsScrollView
            fill
            value={tab}
            onChange={setTab}
            pages={[
              {
                value: 'pending',
                content: questions.isPending ? (
                  loading
                ) : pending.length === 0 ? (
                  <EmptyState icon={CheckCircleIcon} title={t('workshop.nothingToValidate')} description={t('workshop.nothingToValidateText')} />
                ) : (
                  <div className="grid content-start gap-3 px-4 pb-8">
                    {shownPending.map((question) => (
                      <ModerationCard
                        key={question.questionId}
                        author={author(question)}
                        question={questionText(question, language)}
                        answers={answersOf(question)}
                        correct={QUESTION_CHOICES.indexOf(question.correctAnswer)}
                        onApprove={() => moderate.mutate({ questionId: question.questionId, decision: 'approve' })}
                        onReject={() => {
                          setReason('')
                          setRejecting(question.questionId)
                        }}
                        onEdit={() => edit(question)}
                      />
                    ))}
                    <FeedFooter
                      state={shownPending.length < pending.length ? 'more' : 'end'}
                      pages={pendingPages}
                      onLoadMore={() => setPendingPages((value) => value + 1)}
                      onRetry={() => setPendingPages((value) => value + 1)}
                      endLabel={t('workshop.validateEnd')}
                    />
                  </div>
                ),
              },
              {
                value: 'reports',
                content: queue.isPending ? (
                  loading
                ) : listed.length === 0 ? (
                  <EmptyState icon={CheckCircleIcon} title={t('workshop.noReport')} description={t('workshop.noReportText')} />
                ) : (
                  <div className="px-4 pb-8">
                    <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
                      {shownReports.map((item, index) => (
                        <ListRow
                          key={item.question.questionId}
                          icon={item.question.status === 'SUSPENDED' ? ProhibitIcon : WarningIcon}
                          label={questionText(item.question, language)}
                          sub={reportSub(item)}
                          control="chevron"
                          onClick={() => void navigate(ROUTES.questionReports(topicId, item.question.questionId))}
                          last={index === shownReports.length - 1}
                        />
                      ))}
                    </div>
                    <FeedFooter
                      className="pt-4"
                      state={shownReports.length < listed.length ? 'more' : 'end'}
                      pages={reportPages}
                      onLoadMore={() => setReportPages((value) => value + 1)}
                      onRetry={() => setReportPages((value) => value + 1)}
                      endLabel={t('workshop.reportsEnd')}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Screen>
  )
}
