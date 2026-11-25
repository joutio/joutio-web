import {
  useArchiveQuestion as useArchiveCommand,
  useContributedTopics,
  useCreatedTopics,
  useCreateTopic as useCreateCommand,
  useDeleteQuestion as useDeleteQuestionCommand,
  useDeleteTopic as useDeleteTopicCommand,
  useDismissReports as useDismissCommand,
  useDraftTopic as useDraftCommand,
  useModerateQuestion as useModerateCommand,
  usePublishTopic as usePublishCommand,
  useReportQueue as useReportQueueQuery,
  useSameNameTopic as useSameNameQuery,
  useSaveQuestion as useSaveCommand,
  useTeamChange as useTeamCommand,
  useTopicQuestions as useQuestionsQuery,
  useUpdateTopicCategory as useCategoryCommand,
  useUpdateTopicDescription as useDescriptionCommand,
  useUpdateTopicImage as useImageCommand,
  useUpdateTopicNames as useNamesCommand,
  useUpdateTopicPictogram as usePictogramCommand,
  useUpdateTopicTitles as useTitlesCommand,
  useTeam as useTeamQuery,
  useWorkshop as useWorkshopQuery,
  useWorkshopTodo,
} from '@joutio/client/authoring'
import { useMe } from '@joutio/client/me'
import { isFrozen, planLimits, premiumReasonOf, quotaProblemOf, type PremiumReason } from '@joutio/client/premium'
import { useSuggestions } from '@joutio/client/search'
import type { TopicCardView } from '@joutio/client/topics'
import { showPremium } from '@/features/premium'
import { useT, type MessageKey } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { useDebounced } from '@/shared/use-debounced'

/* ───────────── Lectures (`@joutio/client`) ───────────── */

/** Mes sujets, brouillons et publiés. */
export const useMyTopics = useContributedTopics

/** Sujets dont je suis le créateur (`mine=true`) : comptent seuls dans le plafond de sujets publiés. */
export { useCreatedTopics }

/** Mes sujets › À traiter : actions en attente par sujet géré. */
export const useTopicTodo = useWorkshopTodo

/** Équipe d'un sujet. */
export const useTeam = (topicId: string) => useTeamQuery(topicId || undefined)

/** Un sujet de l'atelier et mes droits dessus. */
export function useWorkshop(topicId: string) {
  const query = useWorkshopQuery(topicId || undefined)
  return { ...query, topic: query.data?.topic, permissions: query.data?.permissions, titles: query.data?.titles ?? null, closedReason: query.data?.closedReason ?? null }
}

/** Toutes les questions du sujet ; `enabled` faux : rien n'est lu. */
export const useTopicQuestions = (topicId: string, enabled = true) => useQuestionsQuery(enabled && topicId ? topicId : undefined)

/** File des signalements ouverts d'un sujet. */
export const useReportQueue = (topicId: string, enabled = true) => useReportQueueQuery(enabled && topicId ? topicId : undefined)

/** Joueurs à inviter dans l'équipe : la recherche globale (2 caractères au moins), 20 résultats. */
export const usePlayerSearch = (query: string) => useSuggestions(query, 20)

/** Limites du plan lues dans `MeView.limits` (appliquées par le BFF) et feuille Premium avec l'accroche de la limite. */
export function useCreationLimits() {
  const me = useMe().data
  return { premium: me?.premium ?? false, limits: planLimits(me), askPremium: (reason: PremiumReason) => showPremium(reason) }
}

/**
 * Sujets gelés (`creation.md` § 3, P21) : sans Premium, au-delà du plafond de sujets publiés, mes sujets publiés ne se
 * modifient plus. Calculé sur les sujets dont je suis le créateur ; le BFF refuse de toute façon (`topic:overQuota`).
 */
export function useFrozen() {
  const me = useMe().data
  const created = useCreatedTopics()
  const published = created.data?.content.filter((topic) => topic.status === 'PUBLISHED').length ?? 0
  const frozen = isFrozen(me, published)
  return {
    frozen,
    /** Sujets publiés dont je suis le créateur. */
    published,
    limit: planLimits(me).publishedTopics,
    /** Ce sujet est-il gelé pour moi ? Seul son créateur le sait d'avance ; un membre de l'équipe l'apprend du BFF. */
    locks: (topic: Pick<TopicCardView, 'status'> | undefined, role: string | undefined) => frozen && role === 'creator' && topic?.status === 'PUBLISHED',
  }
}

/* ───────────── Retour des commandes ───────────── */

/** Limite du plan dans une erreur, éventuellement enveloppée (échec partiel : `cause`). */
const quotaOf = (error: unknown) => quotaProblemOf(error) ?? (error instanceof Error ? quotaProblemOf(error.cause) : null)

/**
 * Échec d'une écriture : une limite du plan ouvre la feuille Premium avec son accroche (`creation.md` § 3) ; au
 * plafond Premium, ou pour toute autre erreur, un toast.
 */
function useFailure() {
  const t = useT()
  const premium = useMe().data?.premium ?? false
  return (title: MessageKey, text: MessageKey = 'home.errorText', error?: unknown) => {
    const problem = quotaOf(error)
    if (problem && !premium) return showPremium(premiumReasonOf(problem))
    toast.error(t(title), t(problem ? 'workshop.limitText' : text))
  }
}

type Then<R> = { onSuccess?: (result: R) => void }

/** Mutation de `@joutio/client` telle que l'atelier l'appelle (variables, puis issue). */
type Command<V, R> = {
  isPending: boolean
  mutate(variables: V, options?: { onSuccess?: (result: R) => void; onError?: (error: Error) => void }): void
  mutateAsync(variables: V): Promise<R>
}

type Feedback<V, R> = { error: MessageKey | ((variables: V) => MessageKey); errorText?: MessageKey; success?: MessageKey | ((variables: V, result: R) => MessageKey | null) }

/**
 * Commande de l'atelier : optimiste dans `@joutio/client` ; l'app annonce l'issue (toast de succès, limite du plan ou
 * erreur) par `mutate(v, { onSuccess, onError })`.
 */
function useWithFeedback<V, R>(command: Command<V, R>, feedback: Feedback<V, R>) {
  const t = useT()
  const fail = useFailure()
  const announce = (variables: V, result: R) => {
    const key = typeof feedback.success === 'function' ? feedback.success(variables, result) : feedback.success
    if (key) toast.success(t(key))
  }
  const failed = (variables: V, error: unknown) => fail(typeof feedback.error === 'function' ? feedback.error(variables) : feedback.error, feedback.errorText, error)
  return {
    isPending: command.isPending,
    mutate: (variables: V, then: Then<R> = {}) =>
      command.mutate(variables, {
        onSuccess: (result) => {
          announce(variables, result)
          then.onSuccess?.(result)
        },
        onError: (error) => failed(variables, error),
      }),
    mutateAsync: async (variables: V) => {
      try {
        const result = await command.mutateAsync(variables)
        announce(variables, result)
        return result
      } catch (error) {
        failed(variables, error)
        throw error
      }
    },
  }
}

/* ───────────── Sujet ───────────── */

export const useCreateTopic = () => useWithFeedback(useCreateCommand(), { error: 'workshop.createError' })
export const useUpdateTopicNames = (topicId: string) => useWithFeedback(useNamesCommand(topicId), { error: 'workshop.nameError' })
export const useUpdateTopicCategory = (topicId: string) => useWithFeedback(useCategoryCommand(topicId), { error: 'workshop.categoryError' })
export const useUpdateTopicImage = (topicId: string) => useWithFeedback(useImageCommand(topicId), { error: 'workshop.imageError' })
export const useUpdateTopicPictogram = (topicId: string) => useWithFeedback(usePictogramCommand(topicId), { error: 'workshop.pictogramError' })
export const useUpdateTopicDescription = (topicId: string) => useWithFeedback(useDescriptionCommand(topicId), { error: 'workshop.descriptionError' })
export const useUpdateTopicTitles = (topicId: string) => useWithFeedback(useTitlesCommand(topicId), { error: 'workshop.titlesError', success: 'workshop.titlesSaved' })
export const usePublishTopic = (topicId: string) =>
  useWithFeedback(usePublishCommand(topicId), { error: 'workshop.publishError', errorText: 'workshop.publishErrorText', success: 'workshop.published' })
export const useDraftTopic = (topicId: string) => useWithFeedback(useDraftCommand(topicId), { error: 'workshop.draftError', success: 'workshop.drafted' })
export const useDeleteTopic = (topicId: string) => useWithFeedback(useDeleteTopicCommand(topicId), { error: 'workshop.deleteError', success: 'workshop.deleted' })

/* ───────────── Questions ───────────── */

/**
 * Enregistre une question (création ou modification) : la liste et la file l'affichent déjà au retour. Des
 * signalements restés ouverts après la correction s'annoncent.
 */
export function useSaveQuestion(topicId: string) {
  const t = useT()
  return useWithFeedback(useSaveCommand(topicId), {
    error: 'workshop.questionError',
    success: (_variables, { reportsResolved }) => {
      if (!reportsResolved) toast.error(t('workshop.reportsStillOpen'), t('home.errorText'))
      return 'workshop.questionSaved'
    },
  })
}

export const useModerateQuestion = (topicId: string) =>
  useWithFeedback(useModerateCommand(topicId), {
    error: ({ decision }) => (decision === 'approve' ? 'workshop.approveError' : 'workshop.rejectError'),
    success: ({ decision }) => (decision === 'approve' ? 'workshop.approved' : 'workshop.rejected'),
  })

/** Archiver ou restaurer (retour en attente). */
export const useArchiveQuestion = (topicId: string) =>
  useWithFeedback(useArchiveCommand(topicId), { error: 'workshop.lifecycleError', success: ({ restore }) => (restore ? 'workshop.restored' : 'workshop.archived') })

export const useDeleteQuestion = (topicId: string) => useWithFeedback(useDeleteQuestionCommand(topicId), { error: 'workshop.questionDeleteError', success: 'workshop.questionDeleted' })

/** « Clore sans modifier » : les signalements ouverts de la question sont écartés. */
export const useDismissReports = (topicId: string) => useWithFeedback(useDismissCommand(topicId), { error: 'workshop.reportsCloseError', success: 'workshop.reportsClosed' })

/* ───────────── Équipe ───────────── */

/** Change le rôle d'un membre, l'ajoute ou le retire. Les administrateurs doivent être Premium (refus du BFF sinon). */
export const useTeamChange = (topicId: string) => useWithFeedback(useTeamCommand(topicId), { error: 'workshop.teamError', errorText: 'workshop.teamErrorText' })

/**
 * Sujet publié qui porte déjà ce nom (2026-11-16) : avertissement non bloquant de la feuille « Nouveau sujet », pour
 * inciter à un titre plus original et plus facile à retrouver. Recherche après 300 ms sans frappe, dès 3 caractères.
 */
export function useSameNameTopic(name: string): TopicCardView | undefined {
  const search = useDebounced(name.trim(), 300)
  const match = useSameNameQuery(search).data
  return search === name.trim() ? match : undefined
}
