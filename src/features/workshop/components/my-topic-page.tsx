import { MAX_NAME, MIN_QUESTIONS, todoTotal, workshopRole, type QuestionEditorView } from '@joutio/client-domain/authoring'
import { FileDashedIcon, ImageIcon, ListChecksIcon, PencilSimpleIcon, ShieldCheckIcon, SquaresFourIcon, StickerIcon, TrashIcon, UsersThreeIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { useBack } from '@/shared/use-back'
import { Button, EmptyState, ListRow, ParallaxScreen, Pill, SectionHeader, Skeleton, tokens } from '@/ui'
import {
  useCreationLimits,
  useDeleteTopic,
  useDraftTopic,
  usePublishTopic,
  useReportQueue,
  useTeam,
  useTopicQuestions,
  useTopicTodo,
  useUpdateTopicCategory,
  useUpdateTopicImage,
  useUpdateTopicNames,
  useUpdateTopicPictogram,
  useWorkshop,
} from '../hooks/use-workshop'
import { LocalizedFieldSheet, TopicImageSheet, UniverseSheet } from './workshop-sheets'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

type Sheet = 'name' | 'universe' | 'image' | 'pictogram'

const approvedOf = (questions: readonly QuestionEditorView[]) => questions.filter((question) => question.status === 'APPROVED').length

/**
 * Mon sujet (`creation.md` § 1, lab `MyTopicPage`) : même page en brouillon et publié, sans bottom nav. En-tête en
 * parallaxe comme la Fiche sujet, statut (et rôle s'il n'est pas créateur) ; Sujet (nom FR/EN, univers, vignette,
 * pictogramme) et Contenu (Questions, Équipe, Modération) ; en bas, Publier et Supprimer le brouillon, ou Repasser en
 * brouillon. Un rédacteur ne voit que Questions.
 */
export function MyTopicPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const { topicId = '' } = useParams()
  const back = useBack(ROUTES.myTopics)
  const workshop = useWorkshop(topicId)
  const { topic, permissions } = workshop
  const role = workshopRole(permissions)
  const manager = Boolean(permissions?.canManage)
  const { premium, askPremium } = useCreationLimits()
  const questions = useTopicQuestions(topicId)
  const todo = useTopicTodo()
  const queue = useReportQueue(topicId, manager)
  const team = useTeam(manager && premium ? topicId : '')
  const saveNames = useUpdateTopicNames(topicId)
  const saveCategory = useUpdateTopicCategory(topicId)
  const saveImage = useUpdateTopicImage(topicId)
  const savePictogram = useUpdateTopicPictogram(topicId)
  const publish = usePublishTopic(topicId)
  const unpublish = useDraftTopic(topicId)
  const remove = useDeleteTopic(topicId)
  const [sheet, setSheet] = useState<Sheet>()
  const [nameKey, setNameKey] = useState(0)
  const close = () => setSheet(undefined)

  if (!topic)
    return (
      <div className="grid h-full content-start gap-3 p-4">
        {workshop.isError ? (
          <EmptyState
            className="pt-16"
            icon={WarningCircleIcon}
            title={t('workshop.topicError')}
            description={t('workshop.topicErrorText')}
            action={
              <div className="grid gap-2">
                <Button loading={workshop.isRefetching} onClick={() => void workshop.refetch()}>
                  {t('common.retry')}
                </Button>
                <Button variant="plain" tone="neutral" onClick={back}>
                  {t('pending.creation')}
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <Skeleton shape="card" className="h-72" />
            <Skeleton shape="row" />
            <Skeleton shape="row" />
          </>
        )}
      </div>
    )

  const name = topicName(topic.names, language)
  const english = topic.names.en ?? ''
  const category = toCategoryCode(topic.category)
  const draft = topic.status === 'DRAFT'
  const list = questions.data ?? []
  const approved = questions.data ? approvedOf(list) : topic.questionsCount
  const visible = list.filter((question) => question.status !== 'ARCHIVED').length
  const ready = approved >= MIN_QUESTIONS
  const missing = MIN_QUESTIONS - approved
  const pendingCount = list.filter((question) => question.status === 'PENDING' || question.status === 'SUSPENDED').length
  const reports = queue.data?.length ?? 0
  const todoCount = questions.data && queue.data ? pendingCount + reports : todoTotal(todo.data?.find((item) => item.topicId === topicId))

  const confirmUnpublish = () =>
    showDialog({
      sheet: true,
      icon: FileDashedIcon,
      title: t('workshop.unpublishTitle'),
      message: t('workshop.unpublishText'),
      actions: [
        { label: t('workshop.unpublish'), variant: 'filled', onClick: () => unpublish.mutate() },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })
  const confirmDelete = () =>
    showDialog({
      sheet: true,
      tone: 'danger',
      icon: TrashIcon,
      title: t('workshop.deleteTitle', { name }),
      message: t(list.length > 1 ? 'workshop.deleteTextMany' : 'workshop.deleteTextOne', { count: list.length }),
      actions: [
        {
          label: t('workshop.delete'),
          variant: 'filled',
          tone: 'destructive',
          onClick: () => {
            remove.mutate()
            void navigate(ROUTES.myTopics, { replace: true })
          },
        },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  return (
    <ParallaxScreen
      barTitleStart
      image={topic.imageUrl ?? undefined}
      title={name}
      eyebrow={<Pill category={category}>{tokens.category[category].label}</Pill>}
      onBack={back}
      intro={
        <div className="flex justify-start gap-2">
          <Pill tone={draft ? 'neutral' : 'correct'}>{t(draft ? 'workshop.draft' : 'workshop.publishedStatus')}</Pill>
          {role !== 'creator' && <Pill tone="neutral">{t(role === 'admin' ? 'workshop.roleAdmin' : 'workshop.roleWriter')}</Pill>}
        </div>
      }
      bottomBar={
        !manager ? undefined : draft ? (
          <div className="grid gap-1">
            <Button full size="L" disabled={!ready} loading={publish.isPending} onClick={() => publish.mutate()}>
              {t('workshop.publish')}
            </Button>
            {!ready && <span className="jo-type-caption text-center text-jo-muted">{t(missing > 1 ? 'workshop.missingMany' : 'workshop.missingOne', { count: missing })}</span>}
            {role === 'creator' && (
              <Button full variant="plain" tone="destructive" size="M" icon={TrashIcon} onClick={confirmDelete}>
                {t('workshop.deleteDraft')}
              </Button>
            )}
          </div>
        ) : (
          <Button full size="L" variant="gray" tone="neutral" icon={FileDashedIcon} onClick={confirmUnpublish}>
            {t('workshop.unpublish')}
          </Button>
        )
      }
      overlay={
        manager ? (
          <>
            <LocalizedFieldSheet
              key={nameKey}
              open={sheet === 'name'}
              title={t('workshop.name')}
              label={t('workshop.name')}
              initial={{ fr: topic.names.fr ?? '', en: english }}
              max={MAX_NAME}
              placeholder={{ fr: t('workshop.namePlaceholder'), en: 'For example, Loire Valley castles' }}
              onClose={close}
              onSave={({ fr, en }) => {
                const changed = { ...(fr !== topic.names.fr ? { fr } : {}), ...(en && en !== english ? { en } : {}) }
                if (Object.keys(changed).length > 0) saveNames.mutate(changed)
                close()
              }}
            />
            <UniverseSheet open={sheet === 'universe'} value={category} onClose={close} onChange={(next) => saveCategory.mutate(next)} />
            <TopicImageSheet
              open={sheet === 'image'}
              title={t('workshop.thumbnail')}
              subtitle={t('workshop.optional')}
              hint={t('settings.bannerHint')}
              image={topic.imageUrl}
              onClose={close}
              onChange={(url) => saveImage.mutate(url)}
            />
            <TopicImageSheet
              open={sheet === 'pictogram'}
              title={t('workshop.pictogram')}
              subtitle={t('workshop.pictogramSub')}
              hint={t('workshop.pictogramHint')}
              image={topic.pictogramUrl}
              png
              onClose={close}
              onChange={(url) => savePictogram.mutate(url)}
            />
          </>
        ) : undefined
      }
    >
      <div className="grid gap-6 px-4 pt-2 pb-8">
        {manager && (
          <section className="grid gap-3">
            <SectionHeader title={t('workshop.topic')} />
            <div className={CARD}>
              <ListRow
                icon={PencilSimpleIcon}
                label={t('workshop.name')}
                control="chevron"
                value={topic.names.fr ?? name}
                sub={english ? `English : ${english}` : t('workshop.englishOptional')}
                onClick={() => {
                  setNameKey((key) => key + 1)
                  setSheet('name')
                }}
              />
              <ListRow icon={SquaresFourIcon} label={t('workshop.universe')} control="chevron" value={tokens.category[category].label} onClick={() => setSheet('universe')} />
              <ListRow icon={ImageIcon} label={t('workshop.thumbnail')} control="chevron" value={t(topic.imageUrl ? 'settings.bannerEdit' : 'settings.bannerAdd')} onClick={() => setSheet('image')} />
              <ListRow icon={StickerIcon} label={t('workshop.pictogram')} control="chevron" value={t(topic.pictogramUrl ? 'settings.bannerEdit' : 'settings.bannerAdd')} onClick={() => setSheet('pictogram')} last />
            </div>
          </section>
        )}
        <section className="grid gap-3">
          <SectionHeader title={t('workshop.content')} />
          <div className={CARD}>
            <ListRow
              icon={ListChecksIcon}
              label={t('workshop.questions')}
              control="chevron"
              value={draft ? `${approved} / ${MIN_QUESTIONS}` : String(visible || approved)}
              onClick={() => void navigate(ROUTES.topicQuestions(topicId))}
              last={!manager}
            />
            {manager && (
              <ListRow
                icon={UsersThreeIcon}
                label={t('workshop.team')}
                control="chevron"
                value={premium ? (team.data ? String(team.data.length) : undefined) : 'Premium'}
                onClick={() => (premium ? void navigate(ROUTES.topicTeam(topicId)) : askPremium('team'))}
              />
            )}
            {manager && <ListRow icon={ShieldCheckIcon} label={t('workshop.moderation')} control="chevron" value={String(todoCount)} onClick={() => void navigate(ROUTES.topicModeration(topicId))} last />}
          </div>
        </section>
      </div>
    </ParallaxScreen>
  )
}
