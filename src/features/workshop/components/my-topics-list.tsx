import type { TopicCardView } from '@joutio/client-domain/api-types'
import { MAX_NAME, MIN_QUESTIONS, todoTotal } from '@joutio/client-domain/authoring'
import { PencilSimpleIcon, PlusIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Button, EmptyState, Field, ListRow, MobileSheet, SectionHeader, Skeleton, TopicRow, tokens, type CategoryCode } from '@/ui'
import { useCreateTopic, useCreationLimits, useFrozen, useMyTopics, useTopicTodo } from '../hooks/use-workshop'
import { FrozenNotice } from './frozen-notice'
import { UniverseSheet } from './workshop-sheets'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

/** Nouveau sujet : le nom et l'univers suffisent, le reste se règle sur la page du sujet. */
function CreateTopicSheet({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (topic: { name: string; category: CategoryCode }) => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryCode>('GENERAL')
  const [universeOpen, setUniverseOpen] = useState(false)
  return (
    <>
      <MobileSheet
        open={open}
        onClose={onClose}
        title={t('workshop.newTopic')}
        footer={
          <Button full size="L" disabled={name.trim() === ''} onClick={() => onCreate({ name: name.trim(), category })}>
            {t('workshop.createDraft')}
          </Button>
        }
      >
        <div className="grid gap-4">
          <Field label={t('workshop.name')} placeholder={t('workshop.namePlaceholder')} value={name} maxLength={MAX_NAME} counter={`${name.length} / ${MAX_NAME}`} onChange={(event) => setName(event.target.value)} />
          <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
            <ListRow label={t('workshop.universe')} control="chevron" value={tokens.category[category].label} onClick={() => setUniverseOpen(true)} last />
          </div>
          <p className="jo-type-caption m-0 text-pretty text-jo-muted">{t('workshop.newTopicText')}</p>
        </div>
      </MobileSheet>
      <UniverseSheet open={open && universeOpen} value={category} onClose={() => setUniverseOpen(false)} onChange={setCategory} />
    </>
  )
}

/**
 * Mes sujets (`design/specs/screens/creation.md`, lab `/screens/creation?view=compact`) : onglet **Création** de
 * l'Accueil (2026-11-13, remplace l'entrée par Réglages). « Créer un sujet » en tête, puis « À traiter » (questions à
 * valider, signalements ouverts, pastille) et Mes sujets ; Premium au-delà du sujet publié gratuit. Un sujet s'ouvre
 * sur Mon sujet, brouillon ou publié.
 */
export function MyTopicsList() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const topics = useMyTopics()
  const todo = useTopicTodo()
  const create = useCreateTopic()
  const { premium, limits, askPremium } = useCreationLimits()
  const { frozen, published } = useFrozen()
  const [createOpen, setCreateOpen] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const list = topics.data?.content ?? []
  const count = (topic: TopicCardView) => todoTotal(todo.data?.find((item) => item.topicId === topic.topicId))
  const pending = list.filter((topic) => count(topic) > 0)
  const others = list.filter((topic) => count(topic) === 0)

  const openCreate = () => {
    if (!premium && published >= limits.publishedTopics) return askPremium(frozen ? 'frozen' : 'topics')
    setCreateKey((key) => key + 1)
    setCreateOpen(true)
  }
  const sub = (topic: TopicCardView) =>
    topic.status === 'DRAFT' ? t('workshop.draftSub', { count: topic.questionsCount, min: MIN_QUESTIONS }) : t(topic.questionsCount > 1 ? 'workshop.publishedSubMany' : 'workshop.publishedSubOne', { count: topic.questionsCount })
  const rows = (items: readonly TopicCardView[], badge: boolean) => (
    <div className={CARD}>
      {items.map((topic, index) => (
        <TopicRow
          key={topic.topicId}
          title={topicName(topic.names, language)}
          category={toCategoryCode(topic.category)}
          image={topic.pictogramUrl ?? topic.imageUrl ?? undefined}
          sub={sub(topic)}
          badge={badge ? count(topic) : undefined}
          disabled={topic.topicId.startsWith('pending-')}
          onClick={() => void navigate(ROUTES.myTopic(topic.topicId))}
          last={index === items.length - 1}
        />
      ))}
    </div>
  )

  return (
    <>
      <CreateTopicSheet
        key={createKey}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={({ name, category }) => {
          setCreateOpen(false)
          create.mutate({ name, category }, { onSuccess: ({ id }) => void navigate(ROUTES.myTopic(id)) })
        }}
      />
      {topics.isPending ? (
        <div className="grid gap-2 px-4" aria-label={t('common.loading')}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} shape="row" className="h-16" />
          ))}
        </div>
      ) : topics.isError && !topics.data ? (
        <EmptyState
          className="pt-8"
          icon={WarningCircleIcon}
          title={t('workshop.topicsError')}
          description={t('home.errorText')}
          action={
            <Button loading={topics.isRefetching} onClick={() => void topics.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          className="pt-8"
          icon={PencilSimpleIcon}
          title={t('workshop.emptyTitle')}
          description={t('workshop.emptyText', { min: MIN_QUESTIONS })}
          action={
            <Button full onClick={openCreate}>
              {t('workshop.create')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 px-4">
          <Button full icon={PlusIcon} onClick={openCreate}>
            {t('workshop.create')}
          </Button>
          {frozen && <FrozenNotice published={published} limit={limits.publishedTopics} />}
          {pending.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader title={t('workshop.todo')} />
              {rows(pending, true)}
            </section>
          )}
          {others.length > 0 && (
            <section className="grid gap-3">
              {pending.length > 0 && <SectionHeader title={t('pending.creation')} />}
              {rows(others, false)}
            </section>
          )}
        </div>
      )}
    </>
  )
}
