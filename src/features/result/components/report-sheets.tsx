import type { QuestionReportReason, UserReportReason } from '@joutio/client-domain/api-types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Field, ListRow, MobileSheet } from '@/ui'
import { resultService } from '../lib/result-service'

const MAX_COMMENT = 500

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
  const [reasons, setReasons] = useState<UserReportReason[]>([])
  const [comment, setComment] = useState('')
  const report = useMutation({
    mutationFn: () => resultService.reportPlayer(userId, { reasons, comment: comment.trim() || undefined, gameId }),
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
          <Button full disabled={reasons.length === 0} loading={report.isPending} onClick={() => report.mutate()}>
            {t('report.send')}
          </Button>
        )
      }
    >
      {sent ? (
        <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{t('report.playerThanks')}</p>
      ) : (
        <div className="grid gap-3">
          <Reasons items={PLAYER_REASONS} value={reasons} onChange={setReasons} label={t('report.playerWhat')} prefix="report.player" />
          <Field
            label={t('report.details')}
            placeholder={t('report.playerPlaceholder')}
            multiline
            value={comment}
            maxLength={MAX_COMMENT}
            counter={`${comment.length} / ${MAX_COMMENT}`}
            onChange={(event) => setComment(event.target.value)}
          />
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
  const [reasons, setReasons] = useState<QuestionReportReason[]>([])
  const [comment, setComment] = useState('')
  const report = useMutation({
    mutationFn: () => resultService.reportQuestion(questionId ?? '', { gameId, reasons, comment: comment.trim() || undefined, language }),
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
          <Button full disabled={reasons.length === 0 || !questionId} loading={report.isPending} onClick={() => report.mutate()}>
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
          <Reasons items={items} value={reasons} onChange={setReasons} label={t('report.questionWhat')} prefix="report.question" />
          <Field
            label={t('report.details')}
            placeholder={t('report.questionPlaceholder')}
            multiline
            value={comment}
            maxLength={MAX_COMMENT}
            counter={`${comment.length} / ${MAX_COMMENT}`}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
      )}
    </MobileSheet>
  )
}
