import { isTranslated, MIN_QUESTIONS, workshopRole, questionStatus, questionText, sortQuestions, type QuestionSort, type QuestionStatus } from '@joutio/client-domain/authoring'
import { ArrowsDownUpIcon, ListChecksIcon, MagnifyingGlassIcon, PlusIcon, SlidersHorizontalIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { useBack } from '@/shared/use-back'
import { Button, Chip, EmptyState, FeedFooter, IconButton, ListRow, MobileSheet, MobileTopBar, Notice, ProgressBar, RadioGroup, Screen, SearchField, SectionHeader, Skeleton } from '@/ui'
import { useCreationLimits, useFrozen, useTopicQuestions, useWorkshop } from '../hooks/use-workshop'
import { FrozenNotice } from './frozen-notice'
import { questionNumber } from '../lib/workshop-service'
import { STATUS_LABEL } from '../lib/labels'
import { QuestionStatusIcon } from './question-status'

const PAGE = 10
type StatusFilter = 'all' | QuestionStatus
type TranslationFilter = 'all' | 'translated' | 'untranslated'

/** Valeurs du domaine (`QUESTION_SORTS`), libellés traduits. « Plus signalées » n'existe qu'une fois publié. */
const SORTS: readonly { value: QuestionSort; label: MessageKey }[] = [
  { value: 'Plus récentes', label: 'workshop.sortRecent' },
  { value: 'Plus signalées', label: 'workshop.sortReported' },
  { value: 'Plus anciennes', label: 'workshop.sortOldest' },
  { value: 'Ordre alphabétique', label: 'workshop.sortAlpha' },
]
const STATUSES: readonly StatusFilter[] = ['all', 'approved', 'pending', 'rejected', 'suspended', 'archived']
const TRANSLATIONS: readonly { value: TranslationFilter; label: MessageKey }[] = [
  { value: 'all', label: 'workshop.translationAll' },
  { value: 'translated', label: 'workshop.translated' },
  { value: 'untranslated', label: 'workshop.untranslated' },
]

function Options<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <section className="grid gap-3">
      <SectionHeader title={label} />
      <RadioGroup label={label} className="overflow-hidden rounded-jo-lg bg-jo-raised">
        {options.map((option, index) => (
          <ListRow key={option.value} label={option.label} control="radio" on={value === option.value} onToggle={() => onChange(option.value)} last={index === options.length - 1} />
        ))}
      </RadioGroup>
    </section>
  )
}

/**
 * Questions (`creation.md` § 1, lab `Questions`) : même page en brouillon et publié. Recherche et « Trier et filtrer »
 * dans l'en-tête fixe ; repère du minimum pour publier ou du plafond ; total et puce de tri ; 10 par page. Les statuts
 * de modération sont montrés aussi en brouillon (comme le mobile : un brouillon a de vrais statuts).
 */
export function QuestionsPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const { topicId = '' } = useParams()
  const back = useBack(ROUTES.myTopic(topicId))
  const { topic, permissions } = useWorkshop(topicId)
  const questions = useTopicQuestions(topicId)
  const { premium, limits, askPremium } = useCreationLimits()
  const { published, locks } = useFrozen()
  const locked = locks(topic, workshopRole(permissions))
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [translation, setTranslation] = useState<TranslationFilter>('all')
  const [sort, setSort] = useState<QuestionSort>('Plus récentes')
  const [filterOpen, setFilterOpen] = useState(false)
  const [pages, setPages] = useState(1)

  const draft = topic?.status === 'DRAFT'
  const all = questions.data ?? []
  const count = all.filter((question) => question.status !== 'ARCHIVED').length
  const atCeiling = premium && count >= limits.questionsPerTopic
  const search = query.trim().toLowerCase()
  const filtered = sortQuestions(
    all.filter(
      (question) =>
        (search === '' || questionText(question, language).toLowerCase().includes(search)) &&
        (status === 'all' ? question.status !== 'ARCHIVED' : questionStatus(question) === status) &&
        (translation === 'all' || isTranslated(question) === (translation === 'translated')),
    ),
    sort,
  )
  const visible = filtered.slice(0, pages * PAGE)
  const filterActive = status !== 'all' || translation !== 'all'
  const shown = t(filtered.length > 1 ? 'workshop.questionsMany' : 'workshop.questionsOne', { count: filtered.length })
  const reset = () => {
    setStatus('all')
    setTranslation('all')
    setSort('Plus récentes')
    setPages(1)
  }
  const add = () => {
    if (locked) return askPremium('frozen')
    if (!premium && count >= limits.questionsPerTopic) return askPremium('questions')
    void navigate(ROUTES.questionEditor(topicId))
  }
  const sub = (question: (typeof all)[number]) => {
    const reports = question.openReportCount
    return [
      t(STATUS_LABEL[questionStatus(question)]),
      ...(reports > 0 ? [t(reports > 1 ? 'workshop.reportsMany' : 'workshop.reportsOne', { count: reports })] : []),
      t(isTranslated(question) ? 'workshop.translatedLower' : 'workshop.untranslatedLower'),
    ].join(' · ')
  }
  const filter = <T,>(set: (value: T) => void) => (value: T) => {
    set(value)
    setPages(1)
  }

  return (
    <Screen
      header={
        <>
          <MobileTopBar
            variant="inline"
            back={t('workshop.topic')}
            title={t('workshop.questions')}
            subtitle={topic ? topicName(topic.names, language) : undefined}
            onBack={back}
            right={<IconButton icon={PlusIcon} label={t('workshop.addQuestion')} variant="plain" tone="accent" disabled={atCeiling || locked} onClick={add} />}
          />
          {all.length > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 pt-1 pb-2">
              <SearchField value={query} onChange={filter(setQuery)} placeholder={t('workshop.searchQuestion')} label={t('workshop.searchQuestion')} />
              <IconButton icon={SlidersHorizontalIcon} label={t('workshop.filterQuestions')} variant="gray" tone="neutral" badge={filterActive ? 'dot' : undefined} onClick={() => setFilterOpen(true)} />
            </div>
          )}
        </>
      }
      overlay={
        <MobileSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title={t('workshop.sortAndFilter')}
          action={
            <Button variant="plain" size="S" onClick={reset}>
              {t('workshop.reset')}
            </Button>
          }
          footer={
            <Button full onClick={() => setFilterOpen(false)}>
              {t('workshop.show', { shown })}
            </Button>
          }
        >
          <div className="grid gap-6">
            <Options label={t('topics.sortBy')} options={SORTS.filter((option) => !draft || option.value !== 'Plus signalées').map((option) => ({ value: option.value, label: t(option.label) }))} value={sort} onChange={filter(setSort)} />
            <Options label={t('workshop.status')} options={STATUSES.map((value) => ({ value, label: t(value === 'all' ? 'workshop.statusAll' : STATUS_LABEL[value]) }))} value={status} onChange={filter(setStatus)} />
            <Options label={t('workshop.translation')} options={TRANSLATIONS.map((option) => ({ value: option.value, label: t(option.label) }))} value={translation} onChange={filter(setTranslation)} />
          </div>
        </MobileSheet>
      }
    >
      <div className="grid gap-3 px-4 pt-1 pb-8">
        {questions.isPending ? (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} shape="row" />)
        ) : questions.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('workshop.questionsError')}
            description={t('home.errorText')}
            action={
              <Button loading={questions.isRefetching} onClick={() => void questions.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : (
          <>
            {/* Brouillon : l'avancement vers la publication est sur Mon sujet. */}
            {!draft && <ProgressBar label={t('workshop.ceiling', { count, max: limits.questionsPerTopic })} value={(count * 100) / limits.questionsPerTopic} />}
            {locked && <FrozenNotice published={published} limit={limits.publishedTopics} />}
            {atCeiling && <Notice tone="info" title={t('workshop.fullTitle')} message={t('workshop.fullText', { max: limits.questionsPerTopic })} />}
            {all.length === 0 ? (
              <EmptyState
                icon={ListChecksIcon}
                title={t('workshop.noQuestion')}
                description={t('workshop.noQuestionText', { min: MIN_QUESTIONS })}
                action={
                  <Button full icon={PlusIcon} onClick={add}>
                    {t('workshop.addQuestion')}
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MagnifyingGlassIcon}
                title={t('workshop.noQuestionFound')}
                description={t('workshop.noQuestionFoundText')}
                action={
                  <Button
                    full
                    onClick={() => {
                      setQuery('')
                      reset()
                    }}
                  >
                    {t('workshop.showAll')}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="jo-type-callout text-jo-muted">{shown}</span>
                  <Chip icon={ArrowsDownUpIcon} className="flex-none" onClick={() => setFilterOpen(true)}>
                    {t(SORTS.find((option) => option.value === sort)?.label ?? 'workshop.sortRecent')}
                  </Chip>
                </div>
                <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
                  {visible.map((question, index) => (
                    <ListRow
                      key={question.questionId}
                      leading={<QuestionStatusIcon question={question} />}
                      label={questionText(question, language)}
                      sub={sub(question)}
                      control="chevron"
                      disabled={question.questionId.startsWith('pending-')}
                      onClick={() => void navigate(ROUTES.questionEditor(topicId, question.questionId), { state: { number: questionNumber(all, question.questionId) } })}
                      last={index === visible.length - 1}
                    />
                  ))}
                </div>
                <FeedFooter
                  state={visible.length < filtered.length ? 'more' : 'end'}
                  pages={pages}
                  onLoadMore={() => setPages((value) => value + 1)}
                  onRetry={() => setPages((value) => value + 1)}
                  endLabel={t('workshop.questionsEnd')}
                />
              </>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
