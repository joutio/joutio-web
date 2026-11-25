import type { Language } from '@joutio/client/core/types'
import { buildQuestionPlan, draftFromQuestion, emptyDraft, frenchFilled, MAX_ALT, MAX_ANSWER, MAX_QUESTION, missingAlt, questionActions, translationStatus, workshopRole, type QuestionDraft } from '@joutio/client/authoring'
import { ArchiveIcon, ArrowCounterClockwiseIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionDraftSchema } from '@joutio/client/authoring'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useMe } from '@joutio/client/me'
import { useT } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { useBack } from '@/shared/use-back'
import { AnswerEditorRow, Button, cn, EmptyState, Field, ImagePicker, ListRow, MobileTopBar, Notice, RadioGroup, Screen, SectionHeader, Segmented, Skeleton } from '@/ui'
import { useArchiveQuestion, useCreationLimits, useDeleteQuestion, useFrozen, useSaveQuestion, useTopicQuestions, useWorkshop } from '../hooks/use-workshop'
import { FrozenNotice } from './frozen-notice'
import { questionNumber } from '../lib/questions'
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
  const { topic, permissions } = useWorkshop(topicId)
  const { limits } = useCreationLimits()
  const { published, locks } = useFrozen()
  const questions = useTopicQuestions(topicId)
  const all = questions.data ?? []
  const original = questionId ? all.find((question) => question.questionId === questionId) : undefined
  const save = useSaveQuestion(topicId)
  const lifecycle = useArchiveQuestion(topicId)
  const remove = useDeleteQuestion(topicId)
  const [initial] = useState<QuestionDraft>(() => (original ? draftFromQuestion(original) : emptyDraft()))
  const form = useForm<QuestionDraft>({ resolver: zodResolver(questionDraftSchema(initial.imageUrl)), mode: 'onChange', defaultValues: initial })
  const [texts, answersByLanguage, correct, imageUrl, alt] = useWatch({ control: form.control, name: ['texts', 'answers', 'correct', 'imageUrl', 'alt'] })
  const draft: QuestionDraft = { texts, answers: answersByLanguage, correct, imageUrl, alt }
  const validate = { shouldValidate: true }
  const [language, setLanguage] = useState<Language>('fr')
  // Image choisie dans cet éditeur : son URL diffère de l'image enregistrée (la description devient obligatoire).
  const imageChanged = imageUrl !== initial.imageUrl
  const image = useImageUpload((url) => form.setValue('imageUrl', url, validate))

  const passed = (location.state as { number?: number } | null)?.number
  const number = passed ?? (questionId ? questionNumber(all, questionId) : all.length + 1)
  const role = workshopRole(permissions)
  const locked = locks(topic, role)
  const english = translationStatus(draft)
  const filled = frenchFilled(draft)
  const altMissing = missingAlt(draft, imageChanged)
  const mayEdit =
    !original || Boolean((permissions?.canManage && original.status !== 'ARCHIVED') || (original.creatorId === userId && (original.status === 'PENDING' || original.status === 'REJECTED')))
  const ready = form.formState.isValid && !image.uploading && mayEdit && !locked
  const missingCorrect = filled && draft.correct === undefined
  const actions = original ? questionActions(role, original, userId) : []
  const text = draft.texts[language]
  const answers = draft.answers[language]

  const onSave = form.handleSubmit((values) => {
    const operations = buildQuestionPlan(original, values)
    if (operations.length > 0) save.mutate({ questionId, operations, resolveReports: params.get('resolve') === '1' })
    close()
  })
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
  const setAnswer = (index: number, value: string) => form.setValue(`answers.${language}.${index}`, value, validate)

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
          onConfirm={() => void onSave()}
        />
      }
    >
      <div className="grid gap-4 px-4 pt-2 pb-8">
        <ImagePicker
          image={draft.imageUrl}
          hint={image.progressHint ?? t('workshop.imageHint')}
          progress={image.progress}
          onPick={image.pick}
          onRemove={() => {
            form.setValue('imageUrl', undefined, validate)
            form.setValue('alt', { fr: '', en: '' }, validate)
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
          onChange={(event) => form.setValue(`texts.${language}`, event.target.value, validate)}
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
            onChange={(event) => form.setValue(`alt.${language}`, event.target.value, validate)}
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
                onMarkCorrect={() => form.setValue('correct', index, validate)}
                last={index === answers.length - 1}
              />
            ))}
          </RadioGroup>
          {missingCorrect && <span className="jo-type-caption text-jo-wrong">{t('workshop.correctMissing')}</span>}
        </section>
        {locked && <FrozenNotice published={published} limit={limits.publishedTopics} />}
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
