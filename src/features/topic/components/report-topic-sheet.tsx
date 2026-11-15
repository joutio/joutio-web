import {
  CONTENT_NOTICE_CATEGORIES,
  CONTENT_NOTICE_MIN_DESCRIPTION,
  CONTENT_NOTICES_ENDPOINT,
  type ContentNoticeCategory,
  type ContentNoticeRequest,
} from '@joutio/client/api-types'
import { buildShareUrl } from '@joutio/client/share'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useMe } from '@/features/me'
import { api } from '@/lib/api'
import { useT, type MessageKey } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Field, ListRow, MobileSheet } from '@/ui'

const MAX_DESCRIPTION = 4000

/**
 * Signaler un sujet depuis sa fiche (2026-11-15) : notification de contenu illicite (LCEN/DSA), traitée par la
 * modération dans la console. Lien du sujet, pseudonyme et e-mail du joueur sont remplis d'office. La feuille est
 * montée à neuf à chaque ouverture (clé changée par l'appelant).
 */
export function ReportTopicSheet({ open, onClose, topicId, name }: { open: boolean; onClose: () => void; topicId: string; name: string }) {
  const t = useT()
  const me = useMe()
  const [category, setCategory] = useState<ContentNoticeCategory>()
  const [description, setDescription] = useState('')
  const [goodFaith, setGoodFaith] = useState(false)
  const report = useMutation({
    mutationFn: () =>
      api.post<unknown>(CONTENT_NOTICES_ENDPOINT, {
        name: me.data?.pseudonym ?? '',
        email: me.data?.email ?? '',
        quality: category === 'COPYRIGHT' || category === 'IMAGE_RIGHTS' ? 'RIGHTS_HOLDER' : 'THIRD_PARTY',
        contentUrl: buildShareUrl({ kind: 'topic', id: topicId }),
        category: category ?? 'OTHER_ILLEGAL',
        description: description.trim(),
        goodFaith,
      } satisfies ContentNoticeRequest),
    onError: () => toast.error(t('report.error'), t('home.errorText')),
  })
  const sent = report.isSuccess
  const ready = category !== undefined && description.trim().length >= CONTENT_NOTICE_MIN_DESCRIPTION && goodFaith && Boolean(me.data?.email)
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={sent ? t('report.sent') : t('topicReport.title')}
      subtitle={sent ? undefined : name}
      footer={
        sent ? (
          <Button full variant="gray" tone="neutral" onClick={onClose}>
            {t('report.close')}
          </Button>
        ) : (
          <Button full disabled={!ready} loading={report.isPending} onClick={() => report.mutate()}>
            {t('report.send')}
          </Button>
        )
      }
    >
      {sent ? (
        <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{t('topicReport.thanks')}</p>
      ) : (
        <div className="grid gap-3">
          <div role="radiogroup" aria-label={t('topicReport.what')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
            {CONTENT_NOTICE_CATEGORIES.map((item, index) => (
              <ListRow
                key={item}
                label={t(`topicReport.reason.${item}` as MessageKey)}
                sub={t(`topicReport.reason.${item}.sub` as MessageKey)}
                control="radio"
                on={category === item}
                onToggle={() => setCategory(item)}
                last={index === CONTENT_NOTICE_CATEGORIES.length - 1}
              />
            ))}
          </div>
          <Field
            label={t('topicReport.description')}
            placeholder={t('topicReport.placeholder')}
            multiline
            value={description}
            maxLength={MAX_DESCRIPTION}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
            <ListRow label={t('topicReport.goodFaith')} control="check" on={goodFaith} onToggle={setGoodFaith} last />
          </div>
        </div>
      )}
    </MobileSheet>
  )
}
