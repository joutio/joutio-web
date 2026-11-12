import type { HomeView, Language, PageResponse, TopicCardView, TopicOverviewView } from '@joutio/client-domain/api-types'
import {
  applyQuestionOperations,
  limitsFor,
  type QuestionEditorView,
  type QuestionOperation,
  type ReportedQuestion,
  type TeamMember,
  type TopicTodo,
  type TopicWorkshop,
} from '@joutio/client-domain/authoring'
import { useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import { showPremium } from '@/features/premium'
import { useT, type MessageKey } from '@/lib/i18n'
import { optimisticId, optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/shared/toast'
import { workshopService } from '../lib/workshop-service'

type TopicPage = { topics: TopicCardView[]; last: boolean }
const TOPIC_CACHES = [queryKeys.workshop.all, ['topic'], ['topics'], queryKeys.home] as const

/* ───────────── Lectures ───────────── */

/** Mes sujets, brouillons et publiés. */
export const useMyTopics = (enabled = true) => useQuery({ queryKey: queryKeys.workshop.topics, queryFn: workshopService.myTopics, staleTime: 30_000, enabled })

/** Mes sujets › À traiter : actions en attente par sujet géré. */
export const useTopicTodo = () => useQuery({ queryKey: queryKeys.workshop.todo, queryFn: workshopService.todo, staleTime: 30_000 })

/** Un sujet de l'atelier et mes droits dessus. */
export function useWorkshop(topicId: string) {
  const query = useQuery({ queryKey: queryKeys.workshop.topic(topicId), queryFn: () => workshopService.workshop(topicId), enabled: Boolean(topicId) })
  return { ...query, topic: query.data?.topic, permissions: query.data?.permissions }
}

/** Toutes les questions du sujet. */
export const useTopicQuestions = (topicId: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.workshop.questions(topicId), queryFn: () => workshopService.questions(topicId), enabled: enabled && Boolean(topicId), staleTime: 15_000 })

/** File des signalements ouverts d'un sujet. */
export const useReportQueue = (topicId: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.workshop.reports(topicId), queryFn: () => workshopService.reportQueue(topicId), enabled: enabled && Boolean(topicId), staleTime: 15_000 })

export const useTeam = (topicId: string) => useQuery({ queryKey: queryKeys.workshop.team(topicId), queryFn: () => workshopService.team(topicId), enabled: Boolean(topicId) })

/** Joueurs à inviter dans l'équipe (2 caractères au moins). */
export const usePlayerSearch = (query: string) =>
  useQuery({ queryKey: ['suggestions', 'players', query], queryFn: () => workshopService.players(query), enabled: query.length >= 2, staleTime: 30_000 })

/** Plafonds Gratuit / Premium (appliqués par l'app seule) et feuille Premium avec l'accroche de la limite. */
export function useCreationLimits() {
  const premium = useMe().data?.premium ?? false
  return { premium, limits: limitsFor(premium), askPremium: (reason: 'topics' | 'questions' | 'team') => showPremium(reason) }
}

/* ───────────── Caches ───────────── */

/** Remplace un de mes sujets partout où il est affiché (Mes sujets, atelier, fiche, catalogue, Accueil). */
function patchTopic(client: QueryClient, topicId: string, patch: (topic: TopicCardView) => TopicCardView) {
  const apply = (topic: TopicCardView) => (topic.topicId === topicId ? patch(topic) : topic)
  client.setQueryData<PageResponse<TopicCardView>>(queryKeys.workshop.topics, (page) => (page ? { ...page, content: page.content.map(apply) } : page))
  client.setQueryData<TopicWorkshop>(queryKeys.workshop.topic(topicId), (view) => (view ? { ...view, topic: patch(view.topic) } : view))
  client.setQueryData<TopicOverviewView>(queryKeys.topic.overview(topicId), (view) => (view ? { ...view, topic: patch(view.topic) } : view))
  client.setQueriesData<InfiniteData<TopicPage>>({ queryKey: ['topics', 'list'] }, (data) =>
    data ? { ...data, pages: data.pages.map((page) => ({ ...page, topics: page.topics.map(apply) })) } : data,
  )
  client.setQueryData<HomeView>(queryKeys.home, (home) =>
    home
      ? { ...home, followedTopics: home.followedTopics.map(apply), trendingTopics: home.trendingTopics.map(apply), newTopics: home.newTopics.map(apply), recommendedTopics: home.recommendedTopics.map(apply) }
      : home,
  )
}

function patchTodo(client: QueryClient, topicId: string, patch: (todo: TopicTodo) => TopicTodo) {
  client.setQueryData<TopicTodo[]>(queryKeys.workshop.todo, (items) =>
    items?.map((todo) => (todo.topicId === topicId ? patch(todo) : todo)).filter((todo) => todo.pending + todo.reportedQuestions > 0),
  )
}

function patchQuestion(client: QueryClient, topicId: string, questionId: string, patch: (question: QuestionEditorView) => QuestionEditorView) {
  client.setQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(topicId), (list) => list?.map((question) => (question.questionId === questionId ? patch(question) : question)))
}

/** Applique des opérations à une question en cache (création comprise). */
function applyOperations(client: QueryClient, topicId: string, questionId: string, operations: readonly QuestionOperation[]) {
  client.setQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(topicId), (list) => {
    const next = applyQuestionOperations(list?.find((question) => question.questionId === questionId), questionId, operations)
    if (!next) return list
    return list?.some((question) => question.questionId === questionId) ? list.map((question) => (question.questionId === questionId ? next : question)) : [next, ...(list ?? [])]
  })
}

/** Compteur d'approuvées de Mes sujets, recalculé depuis les questions en cache ; sous 7, le sujet repasse en brouillon. */
function syncApproved(client: QueryClient, topicId: string, draftBelowMinimum = false) {
  const questions = client.getQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(topicId))
  if (!questions) return
  const approved = questions.filter((question) => question.status === 'APPROVED').length
  patchTopic(client, topicId, (topic) => ({ ...topic, questionsCount: approved, status: draftBelowMinimum && approved < 7 ? 'DRAFT' : topic.status }))
}

/** Retire une question de la file des signalements et du compteur « À traiter ». */
function dropFromQueue(client: QueryClient, topicId: string, questionId: string) {
  const queue = client.getQueryData<ReportedQuestion[]>(queryKeys.workshop.reports(topicId))
  if (queue?.some((item) => item.question.questionId === questionId)) patchTodo(client, topicId, (todo) => ({ ...todo, reportedQuestions: Math.max(0, todo.reportedQuestions - 1) }))
  client.setQueryData<ReportedQuestion[]>(queryKeys.workshop.reports(topicId), (items) => items?.filter((item) => item.question.questionId !== questionId))
  patchQuestion(client, topicId, questionId, (question) => ({ ...question, openReportCount: 0 }))
}

function useFailure() {
  const t = useT()
  return (title: MessageKey, text: MessageKey = 'home.errorText') => toast.error(t(title), t(text))
}

/* ───────────── Sujet ───────────── */

export function useCreateTopic() {
  const client = useQueryClient()
  const fail = useFailure()
  return useMutation({
    mutationFn: ({ name, category }: { name: string; category: string }) => workshopService.createTopic(name, category),
    onMutate: async ({ name, category }) => {
      const tempId = optimisticId()
      const transaction = await optimisticUpdate(client, [queryKeys.workshop.all], () => {
        const draft: TopicCardView = {
          topicId: tempId,
          names: { fr: name },
          description: null,
          category,
          categoryLabel: null,
          imageUrl: null,
          bannerUrl: null,
          pictogramUrl: null,
          followersCount: 0,
          questionsCount: 0,
          followed: false,
          status: 'DRAFT',
        }
        client.setQueryData<PageResponse<TopicCardView>>(queryKeys.workshop.topics, (page) =>
          page ? { ...page, content: [draft, ...page.content], totalElements: page.totalElements + 1 } : { content: [draft], totalElements: 1, totalPages: 1, page: 0, size: 100, first: true, last: true },
        )
      })
      return { ...transaction, tempId }
    },
    onSuccess: ({ id }, _variables, context) => {
      patchTopic(client, context.tempId, (topic) => ({ ...topic, topicId: id }))
      client.setQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(id), [])
    },
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.createError')
    },
  })
}

/** Nom français obligatoire, anglais facultatif : une commande par langue modifiée. */
export function useUpdateTopicNames(topicId: string) {
  const client = useQueryClient()
  const fail = useFailure()
  return useMutation({
    mutationFn: async (names: Partial<Record<Language, string>>) => {
      const done: Partial<Record<Language, string>> = {}
      try {
        for (const [language, name] of Object.entries(names) as [Language, string][]) {
          await workshopService.updateName(topicId, language, name)
          done[language] = name
        }
      } catch (cause) {
        throw Object.assign(new Error('partial names', { cause }), { done })
      }
    },
    onMutate: (names: Partial<Record<Language, string>>) => optimisticUpdate(client, TOPIC_CACHES, () => patchTopic(client, topicId, (topic) => ({ ...topic, names: { ...topic.names, ...names } }))),
    onError: (error, _names, context) => {
      context?.rollback()
      if ('done' in error) patchTopic(client, topicId, (topic) => ({ ...topic, names: { ...topic.names, ...(error.done as Partial<Record<Language, string>>) } }))
      fail('workshop.nameError')
    },
  })
}

/** Un champ du sujet (univers, vignette, pictogramme), optimiste. */
function useTopicField<V>(topicId: string, run: (value: V) => Promise<void>, patch: (topic: TopicCardView, value: V) => TopicCardView, error: MessageKey) {
  const client = useQueryClient()
  const fail = useFailure()
  return useMutation({
    mutationFn: run,
    onMutate: (value: V) => optimisticUpdate(client, TOPIC_CACHES, () => patchTopic(client, topicId, (topic) => patch(topic, value))),
    onError: (_error, _value, context) => {
      context?.rollback()
      fail(error)
    },
  })
}

export const useUpdateTopicCategory = (topicId: string) =>
  useTopicField(topicId, (category: string) => workshopService.updateCategory(topicId, category), (topic, category) => ({ ...topic, category }), 'workshop.categoryError')
export const useUpdateTopicImage = (topicId: string) =>
  useTopicField(topicId, (imageUrl: string | null) => workshopService.updateImageUrl(topicId, imageUrl), (topic, imageUrl) => ({ ...topic, imageUrl }), 'workshop.imageError')
export const useUpdateTopicPictogram = (topicId: string) =>
  useTopicField(topicId, (pictogramUrl: string | null) => workshopService.updatePictogramUrl(topicId, pictogramUrl), (topic, pictogramUrl) => ({ ...topic, pictogramUrl }), 'workshop.pictogramError')

export function usePublishTopic(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: () => workshopService.publish(topicId),
    onMutate: () => optimisticUpdate(client, TOPIC_CACHES, () => patchTopic(client, topicId, (topic) => ({ ...topic, status: 'PUBLISHED' }))),
    onSuccess: () => toast.success(t('workshop.published')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.publishError', 'workshop.publishErrorText')
    },
  })
}

export function useDraftTopic(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: () => workshopService.draft(topicId),
    onMutate: () => optimisticUpdate(client, TOPIC_CACHES, () => patchTopic(client, topicId, (topic) => ({ ...topic, status: 'DRAFT' }))),
    onSuccess: () => toast.success(t('workshop.drafted')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.draftError')
    },
  })
}

/** Supprime un brouillon : il quitte Mes sujets sur place. */
export function useDeleteTopic(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: () => workshopService.deleteTopic(topicId),
    onMutate: () =>
      optimisticUpdate(client, [queryKeys.workshop.all], () => {
        client.setQueryData<PageResponse<TopicCardView>>(queryKeys.workshop.topics, (page) =>
          page ? { ...page, content: page.content.filter((topic) => topic.topicId !== topicId), totalElements: Math.max(0, page.totalElements - 1) } : page,
        )
        client.setQueryData<TopicTodo[]>(queryKeys.workshop.todo, (items) => items?.filter((todo) => todo.topicId !== topicId))
      }),
    onSuccess: () => toast.success(t('workshop.deleted')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.deleteError')
    },
  })
}

/* ───────────── Questions ───────────── */

/**
 * Enregistre une question (création ou modification), **optimiste** : la liste et la file affichent déjà la question
 * au retour. `resolveReports` clôt ses signalements ouverts après correction (`RESOLVED`).
 */
export function useSaveQuestion(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: async ({ questionId, operations, resolveReports }: { questionId?: string; operations: readonly QuestionOperation[]; resolveReports?: boolean }) => {
      const id = await workshopService.saveQuestion(topicId, questionId, operations)
      let reportsResolved = true
      if (resolveReports)
        try {
          await workshopService.resolveReports(id, 'RESOLVED')
        } catch {
          reportsResolved = false
        }
      return { id, reportsResolved }
    },
    onMutate: async ({ questionId, operations, resolveReports }) => {
      const localId = questionId ?? optimisticId()
      const transaction = await optimisticUpdate(client, TOPIC_CACHES, () => {
        applyOperations(client, topicId, localId, operations)
        if (questionId && operations.length > 0) patchQuestion(client, topicId, questionId, (question) => (question.status === 'REJECTED' ? { ...question, status: 'PENDING', rejectionReason: null } : question))
        syncApproved(client, topicId)
      })
      const reports = resolveReports ? await optimisticUpdate(client, [queryKeys.workshop.all], () => dropFromQueue(client, topicId, localId)) : undefined
      return { ...transaction, reports, localId }
    },
    onSuccess: ({ id, reportsResolved }, _variables, context) => {
      if (!reportsResolved) {
        context.reports?.rollback()
        toast.error(t('workshop.reportsStillOpen'), t('home.errorText'))
      }
      patchQuestion(client, topicId, context.localId, (question) => ({ ...question, questionId: id }))
      toast.success(t('workshop.questionSaved'))
    },
    onError: (error, _variables, context) => {
      context?.reports?.rollback()
      context?.rollback()
      // Échec partiel : les opérations confirmées restent appliquées.
      if ('completedOperations' in error && Array.isArray(error.completedOperations) && 'questionId' in error && typeof error.questionId === 'string') {
        applyOperations(client, topicId, error.questionId, error.completedOperations as QuestionOperation[])
        syncApproved(client, topicId)
      }
      fail('workshop.questionError')
    },
  })
}

export function useModerateQuestion(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: ({ questionId, decision, reason }: { questionId: string; decision: 'approve' | 'reject'; reason?: string }) =>
      decision === 'approve' ? workshopService.approve(questionId) : workshopService.reject(questionId, reason ?? ''),
    onMutate: ({ questionId, decision }) =>
      optimisticUpdate(client, TOPIC_CACHES, () => {
        const before = client.getQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(topicId))?.find((question) => question.questionId === questionId)
        if (before?.status === 'PENDING') patchTodo(client, topicId, (todo) => ({ ...todo, pending: Math.max(0, todo.pending - 1) }))
        patchQuestion(client, topicId, questionId, (question) => ({ ...question, status: decision === 'approve' ? 'APPROVED' : 'REJECTED', suspended: false, archived: false }))
        syncApproved(client, topicId)
      }),
    onSuccess: (_result, { decision }) => toast.success(t(decision === 'approve' ? 'workshop.approved' : 'workshop.rejected')),
    onError: (_error, { decision }, context) => {
      context?.rollback()
      fail(decision === 'approve' ? 'workshop.approveError' : 'workshop.rejectError')
    },
  })
}

/** Archiver ou restaurer (retour en attente). */
export function useArchiveQuestion(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: ({ questionId, restore }: { questionId: string; restore?: boolean }) => (restore ? workshopService.restore(questionId) : workshopService.archive(questionId)),
    onMutate: ({ questionId, restore }) =>
      optimisticUpdate(client, TOPIC_CACHES, () => {
        patchQuestion(client, topicId, questionId, (question) => ({ ...question, status: restore ? 'PENDING' : 'ARCHIVED', archived: !restore, suspended: false }))
        syncApproved(client, topicId, !restore)
      }),
    onSuccess: (_result, { restore }) => toast.success(t(restore ? 'workshop.restored' : 'workshop.archived')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.lifecycleError')
    },
  })
}

export function useDeleteQuestion(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: (questionId: string) => workshopService.deleteQuestion(questionId),
    onMutate: (questionId: string) =>
      optimisticUpdate(client, TOPIC_CACHES, () => {
        client.setQueryData<QuestionEditorView[]>(queryKeys.workshop.questions(topicId), (items) => items?.filter((question) => question.questionId !== questionId))
        syncApproved(client, topicId, true)
      }),
    onSuccess: () => toast.success(t('workshop.questionDeleted')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.questionDeleteError')
    },
  })
}

/** « Clore sans modifier » : les signalements ouverts de la question sont écartés. */
export function useDismissReports(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const fail = useFailure()
  return useMutation({
    mutationFn: (questionId: string) => workshopService.resolveReports(questionId, 'DISMISSED'),
    onMutate: (questionId: string) => optimisticUpdate(client, [queryKeys.workshop.all], () => dropFromQueue(client, topicId, questionId)),
    onSuccess: () => toast.success(t('workshop.reportsClosed')),
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.reportsCloseError')
    },
  })
}

/* ───────────── Équipe ───────────── */

/** Change le rôle d'un membre, l'ajoute ou le retire. Les administrateurs doivent être Premium (refus du BFF sinon). */
export function useTeamChange(topicId: string) {
  const client = useQueryClient()
  const fail = useFailure()
  const key = queryKeys.workshop.team(topicId)
  return useMutation({
    mutationFn: async ({ member, remove }: { member: TeamMember; remove?: boolean }): Promise<TeamMember | undefined> => {
      if (!remove) return workshopService.setMember(topicId, member.userId, member.role)
      await workshopService.removeMember(topicId, member.userId)
      return undefined
    },
    onMutate: ({ member, remove }) =>
      optimisticUpdate(client, [key], () =>
        client.setQueryData<TeamMember[]>(key, (items) => (remove ? items?.filter((item) => item.userId !== member.userId) : [...(items ?? []).filter((item) => item.userId !== member.userId), member])),
      ),
    onSuccess: (member) => {
      if (member) client.setQueryData<TeamMember[]>(key, (items) => items?.map((item) => (item.userId === member.userId ? member : item)))
    },
    onError: (_error, _variables, context) => {
      context?.rollback()
      fail('workshop.teamError', 'workshop.teamErrorText')
    },
  })
}
