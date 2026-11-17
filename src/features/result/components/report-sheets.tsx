import type { QuestionReportReason, UserReportReason } from '@joutio/client/api-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { MAX_REPORT_COMMENT, questionReportSchema, userReportSchema } from '@joutio/client/forms'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Field, ListRow, MobileSheet } from '@/ui'
import { resultService } from '../lib/result-service'

const PLAYER_REASONS: UserReportReason[] = ['HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'CHEATING', 'SPAM', 'OTHER']
const QUESTION_REASONS: QuestionReportReason[] = ['QUESTION', 'IMAGE', 'ANSWERS']

function Reasons<T extends string>({ items, value, onChange, label, prefix }: { items: readonly T[]; value: readonly T[]; onChange: (next: T[]) => void; label: string; prefix: string }) {
  const t = useT()
  return (
    <div role="group" aria-label={label} className="overflow-hidden rounded-jo-lg bg-jo-raised">
      {items.map((item, index) => (
        <ListRow
          key={item}
          label={t(`${prefix}.${item}` as MessageKey)}
          sub={t(`${prefix}.${item}.sub` as MessageKey)}
          control="check"
          on={value.includes(item)}
          onToggle={(on) => onChange(on ? [...value, item] : value.filter((reason) => reason !== item))}
          last={index === items.length - 1}
        />
      ))}
    </div>
  )
}

/** Commentaire facultatif d'un signalement (`MAX_REPORT_COMMENT`). */
function CommentField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const t = useT()
  return (
    <Field
      label={t('report.details')}
      placeholder={placeholder}
      multiline
      value={value}
      maxLength={MAX_REPORT_COMMENT}
      counter={`${value.length} / ${MAX_REPORT_COMMENT}`}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

/** Formulaire remis à zéro à chaque ouverture : la feuille est montée à neuf (clé changée par l'appelant). */
export type ReportPlayerSheetProps = {
  open: boolean
  onClose: () => void
  userId: string
  name: string
  /** Duel en contexte ; absent depuis la Fiche joueur. */
  gameId?: string
  /** Contexte, par exemple « Ce duel · Rois de France ». */
  subtitle: string
}

/** Signaler l'adversaire depuis le résultat (`resultat.md` § Signalements), le duel en contexte. */
export function ReportPlayerSheet({ open, onClose, userId, name, gameId, subtitle }: ReportPlayerSheetProps) {
  const t = useT()
  const form = useForm({ resolver: zodResolver(userReportSchema), mode: 'onChange', defaultValues: { reasons: [] as UserReportReason[], comment: '' } })
  const report = useMutation({
    mutationFn: ({ reasons, comment }: { reasons: UserReportReason[]; comment: string }) => resultService.reportPlayer(userId, { reasons, comment: comment || undefined, gameId }),
    onError: () => toast.error(t('report.error'), t('home.errorText')),
  })
  const sent = report.isSuccess
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={sent ? t('report.sent') : t('report.playerTitle', { name })}
      subtitle={sent ? undefined : subtitle}
      footer={
        sent ? (
          <Button full variant="gray" tone="neutral" onClick={onClose}>
            {t('report.close')}
          </Button>
        ) : (
          <Button full disabled={!form.formState.isValid} loading={report.isPending} onClick={() => void form.handleSubmit((values) => report.mutate(values))()}>
            {t('report.send')}
          </Button>
        )
      }
    >
      {sent ? (
        <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{t('report.playerThanks')}</p>
      ) : (
        <div className="grid gap-3">
          <Controller
            control={form.control}
            name="reasons"
            render={({ field }) => <Reasons items={PLAYER_REASONS} value={field.value} onChange={field.onChange} label={t('report.playerWhat')} prefix="report.player" />}
          />
          <Controller control={form.control} name="comment" render={({ field }) => <CommentField value={field.value} onChange={field.onChange} placeholder={t('report.playerPlaceholder')} />} />
          <p className="jo-type-caption m-0 text-center text-jo-muted">{t('report.anonymous', { name })}</p>
        </div>
      )}
    </MobileSheet>
  )
}

export type ReportQuestionSheetProps = {
  open: boolean
  onClose: () => void
  questionId: string | null
  gameId: string
  hasImage: boolean
  /** Par exemple « Question 4 sur 7 ». */
  subtitle: string
  onSent: () => void
}

/** Signaler une question depuis Détails du duel : plusieurs motifs, le créateur du sujet ne voit pas qui signale. */
export function ReportQuestionSheet({ open, onClose, questionId, gameId, hasImage, subtitle, onSent }: ReportQuestionSheetProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const form = useForm({ resolver: zodResolver(questionReportSchema), mode: 'onChange', defaultValues: { reasons: [] as QuestionReportReason[], comment: '' } })
  const report = useMutation({
    mutationFn: ({ question, reasons, comment }: { question: string; reasons: QuestionReportReason[]; comment: string }) =>
      resultService.reportQuestion(question, { gameId, reasons, comment: comment || undefined, language }),
    onSuccess: onSent,
    onError: () => toast.error(t('report.error'), t('home.errorText')),
  })
  const sent = report.isSuccess
  const items = QUESTION_REASONS.filter((reason) => hasImage || reason !== 'IMAGE')
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={sent ? t('report.sent') : t('report.questionTitle')}
      subtitle={sent ? undefined : subtitle}
      footer={
        sent ? (
          <Button full variant="gray" tone="neutral" onClick={onClose}>
            {t('report.close')}
          </Button>
        ) : (
          <Button
            full
            disabled={!form.formState.isValid || !questionId}
            loading={report.isPending}
            onClick={() => void form.handleSubmit((values) => questionId && report.mutate({ question: questionId, ...values }))()}
          >
            {t('report.send')}
          </Button>
        )
      }
    >
      {sent ? (
        <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{t('report.questionThanks')}</p>
      ) : (
        <div className="grid gap-3">
          <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{t('report.questionIntro')}</p>
          <Controller
            control={form.control}
            name="reasons"
            render={({ field }) => <Reasons items={items} value={field.value} onChange={field.onChange} label={t('report.questionWhat')} prefix="report.question" />}
          />
          <Controller control={form.control} name="comment" render={({ field }) => <CommentField value={field.value} onChange={field.onChange} placeholder={t('report.questionPlaceholder')} />} />
        </div>
      )}
    </MobileSheet>
  )
}
