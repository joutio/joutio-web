import type { Language } from '@joutio/client-domain/api-types'
import {
  buildQuestionPlan,
  draftFromQuestion,
  emptyDraft,
  frenchFilled,
  isReady,
  MAX_ALT,
  MAX_ANSWER,
  MAX_QUESTION,
  missingAlt,
  questionActions,
  translationStatus,
  workshopRole,
  type QuestionDraft,
} from '@joutio/client-domain/authoring'
import { ArchiveIcon, ArrowCounterClockwiseIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useT } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { useBack } from '@/shared/use-back'
import { AnswerEditorRow, Button, cn, EmptyState, Field, ImagePicker, ListRow, MobileTopBar, Notice, RadioGroup, Screen, SectionHeader, Segmented, Skeleton } from '@/ui'
import { useArchiveQuestion, useDeleteQuestion, useSaveQuestion, useTopicQuestions, useWorkshop } from '../hooks/use-workshop'
import { questionNumber } from '../lib/workshop-service'
import { useImageUpload } from '../hooks/use-image-upload'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

/**
 * Éditeur de question (`creation.md` § 1 et § 2, lab `QuestionEditor`) : modale plein écran. Image facultative,
 * onglets Français / English, question, description de l'image (obligatoire en français pour une image choisie ici,
 * non envoyée : aucun champ backend), quatre réponses et « Juste » commun aux deux langues. Enregistrer s'active quand
 * tout est rempli ; un rédacteur voit le bandeau Validation ; « Gérer » selon le rôle. Enregistrement optimiste : on
 * revient tout de suite à l'écran d'origine.
 */
export function QuestionEditorPage() {
  const { topicId = '', questionId: routeId = 'new' } = useParams()
  const questionId = routeId === 'new' ? undefined : routeId
  const questions = useTopicQuestions(topicId)
  const original = questionId ? questions.data?.find((question) => question.questionId === questionId) : undefined
  // Le brouillon part de la question : on attend qu'elle soit chargée (lien profond).
  if (questionId && !original) return <EditorPending loading={questions.isPending} onRetry={() => void questions.refetch()} topicId={topicId} />
  return <Editor key={questionId ?? 'new'} topicId={topicId} questionId={questionId} />
}

function EditorPending({ loading, onRetry, topicId }: { loading: boolean; onRetry: () => void; topicId: string }) {
  const t = useT()
  const close = useBack(ROUTES.topicQuestions(topicId))
  return (
    <Screen header={<MobileTopBar variant="modal" title={t('workshop.question')} cancel={t('play.close')} onCancel={close} />}>
      {loading ? (
        <div className="grid gap-3 p-4">
          <Skeleton shape="card" />
          <Skeleton shape="row" />
          <Skeleton shape="row" />
        </div>
      ) : (
        <EmptyState className="pt-16" icon={WarningCircleIcon} title={t('workshop.questionUnavailable')} description={t('workshop.questionUnavailableText')} action={<Button onClick={onRetry}>{t('common.retry')}</Button>} />
      )}
    </Screen>
  )
}

function Editor({ topicId, questionId }: { topicId: string; questionId?: string }) {
  const t = useT()
  const location = useLocation()
  const [params] = useSearchParams()
  const close = useBack(ROUTES.topicQuestions(topicId))
  const userId = useMe().data?.userId
  const { permissions } = useWorkshop(topicId)
  const questions = useTopicQuestions(topicId)
  const all = questions.data ?? []
  const original = questionId ? all.find((question) => question.questionId === questionId) : undefined
  const save = useSaveQuestion(topicId)
  const lifecycle = useArchiveQuestion(topicId)
  const remove = useDeleteQuestion(topicId)
  const [draft, setDraft] = useState<QuestionDraft>(() => (original ? draftFromQuestion(original) : emptyDraft()))
  const [language, setLanguage] = useState<Language>('fr')
  const [imageChanged, setImageChanged] = useState(false)
  const image = useImageUpload((url) => {
    setDraft((current) => ({ ...current, imageUrl: url }))
    setImageChanged(true)
  })

  const passed = (location.state as { number?: number } | null)?.number
  const number = passed ?? (questionId ? questionNumber(all, questionId) : all.length + 1)
  const role = workshopRole(permissions)
  const english = translationStatus(draft)
  const filled = frenchFilled(draft)
  const altMissing = missingAlt(draft, imageChanged)
  const mayEdit =
    !original || Boolean((permissions?.canManage && original.status !== 'ARCHIVED') || (original.creatorId === userId && (original.status === 'PENDING' || original.status === 'REJECTED')))
  const ready = isReady(draft, imageChanged) && !image.uploading && mayEdit
  const missingCorrect = filled && draft.correct === undefined
  const actions = original ? questionActions(role, original, userId) : []
  const text = draft.texts[language]
  const answers = draft.answers[language]

  const onSave = () => {
    const operations = buildQuestionPlan(original, draft)
    if (operations.length > 0) save.mutate({ questionId, operations, resolveReports: params.get('resolve') === '1' })
    close()
  }
  const confirmArchive = () =>
    showDialog({
      sheet: true,
      icon: ArchiveIcon,
      title: t('workshop.archiveTitle', { number }),
      message: t('workshop.archiveText'),
      actions: [
        {
          label: t('workshop.archive'),
          variant: 'filled',
          onClick: () => {
            lifecycle.mutate({ questionId: questionId ?? '' })
            close()
          },
        },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })
  const confirmDelete = () =>
    showDialog({
      sheet: true,
      tone: 'danger',
      icon: TrashIcon,
      title: t('workshop.deleteQuestionTitle', { number }),
      message: t('workshop.deleteQuestionText'),
      actions: [
        {
          label: t('workshop.delete'),
          variant: 'filled',
          tone: 'destructive',
          onClick: () => {
            remove.mutate(questionId ?? '')
            close()
          },
        },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })
  const setAnswer = (index: number, value: string) => setDraft({ ...draft, answers: { ...draft.answers, [language]: answers.map((item, position) => (position === index ? value : item)) } })

  return (
    <Screen
      header={
        <MobileTopBar
          variant="modal"
          title={t('workshop.questionNumber', { number })}
          cancel={t('common.cancel')}
          confirm={t('settings.save')}
          confirmDisabled={!ready}
          onCancel={close}
          onConfirm={onSave}
        />
      }
    >
      <div className="grid gap-4 px-4 pt-2 pb-8">
        <ImagePicker
          image={draft.imageUrl}
          hint={image.uploading ? t('settings.uploading') : t('workshop.imageHint')}
          onPick={image.pick}
          onRemove={() => {
            setDraft({ ...draft, imageUrl: undefined, alt: { fr: '', en: '' } })
            setImageChanged(true)
          }}
        />
        {image.field}
        <div className="grid gap-2">
          <Segmented
            label={t('workshop.language')}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
            value={language}
            onChange={setLanguage}
          />
          <span className={cn('jo-type-caption text-pretty', english === 'partial' ? 'text-jo-wrong' : 'text-jo-muted')}>
            {english === 'partial' ? t('workshop.englishPartial') : t('workshop.englishStatus', { status: t(english === 'complete' ? 'workshop.englishComplete' : 'workshop.englishNone') })}
          </span>
        </div>
        <Field
          key={language}
          label={t(language === 'fr' ? 'workshop.question' : 'workshop.questionEnglish')}
          placeholder={language === 'fr' ? t('workshop.questionPlaceholder') : 'Ask your question'}
          hint={language === 'en' ? t('workshop.inFrench', { text: draft.texts.fr.trim() || '—' }) : undefined}
          multiline
          value={text}
          maxLength={MAX_QUESTION}
          counter={`${text.length} / ${MAX_QUESTION}`}
          onChange={(event) => setDraft({ ...draft, texts: { ...draft.texts, [language]: event.target.value } })}
        />
        {draft.imageUrl && (
          <Field
            key={`alt-${language}`}
            label={t(language === 'fr' ? 'workshop.alt' : 'workshop.altEnglish')}
            placeholder={language === 'fr' ? t('workshop.altPlaceholder') : 'What the image shows'}
            hint={language === 'fr' ? t('workshop.altHint') : t('workshop.inFrench', { text: draft.alt.fr.trim() || '—' })}
            error={language === 'fr' && altMissing && filled ? t('workshop.altMissing') : undefined}
            value={draft.alt[language]}
            maxLength={MAX_ALT}
            counter={`${draft.alt[language].length} / ${MAX_ALT}`}
            onChange={(event) => setDraft({ ...draft, alt: { ...draft.alt, [language]: event.target.value } })}
          />
        )}
        <section className="grid gap-3">
          <SectionHeader title={t(language === 'fr' ? 'workshop.answers' : 'workshop.answersEnglish')} subtitle={t('workshop.answersHint')} />
          <RadioGroup label={t('workshop.correctAnswer')} className={CARD}>
            {answers.map((answer, index) => (
              <AnswerEditorRow
                key={`${language}-${index}`}
                index={index + 1}
                value={answer}
                maxLength={MAX_ANSWER}
                placeholder={language === 'en' ? draft.answers.fr[index]?.trim() || undefined : undefined}
                correct={draft.correct === index}
                onChange={(value) => setAnswer(index, value)}
                onMarkCorrect={() => setDraft({ ...draft, correct: index })}
                last={index === answers.length - 1}
              />
            ))}
          </RadioGroup>
          {missingCorrect && <span className="jo-type-caption text-jo-wrong">{t('workshop.correctMissing')}</span>}
        </section>
        {role === 'writer' && <Notice tone="info" title={t('workshop.validation')} message={t('workshop.validationText')} />}
        {actions.length > 0 && (
          <section className="grid gap-3 pt-2">
            <SectionHeader title={t('workshop.manage')} subtitle={actions.includes('archive') ? t('workshop.manageHint') : undefined} />
            <div className={CARD}>
              {actions.includes('archive') && <ListRow icon={ArchiveIcon} label={t('workshop.archiveQuestion')} control="chevron" onClick={confirmArchive} last={!actions.includes('delete')} />}
              {actions.includes('restore') && (
                <ListRow
                  icon={ArrowCounterClockwiseIcon}
                  label={t('workshop.restoreQuestion')}
                  control="chevron"
                  onClick={() => {
                    lifecycle.mutate({ questionId: questionId ?? '', restore: true })
                    close()
                  }}
                  last={!actions.includes('delete')}
                />
              )}
              {actions.includes('delete') && <ListRow icon={TrashIcon} label={t('workshop.deleteQuestion')} destructive control="none" onClick={confirmDelete} last />}
            </div>
          </section>
        )}
      </div>
    </Screen>
  )
}
