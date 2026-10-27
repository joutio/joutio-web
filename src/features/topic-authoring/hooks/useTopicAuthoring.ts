import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { queryKeys } from "@/lib/query-keys"
import { scheduleInvalidate } from "@/shared/utils/optimistic-reconcile"
import { showSuccessToast } from "@/shared/utils/success-toast"
import type {
  CreateTopicInput,
  QuestionEditor,
  ResolveQuestionReportsInput,
  TopicPatch,
} from "../domain/topic-authoring"
import {
  buildQuestionPlan,
  toCreateInput,
  type QuestionDraft,
} from "../lib/question-draft"
import { topicAuthoringService } from "../lib/topic-authoring"

/** Vue d'édition mutable (questions d'un sujet en gestion) : tolérée 30 s. */
const QUESTIONS_STALE_MS = 30_000

/** Questions d'un sujet en gestion : tous statuts, contenus localisés. */
export function useTopicQuestions(topicId: string, page = 0, size = 100) {
  return useQuery({
    queryKey: queryKeys.topics.questions(topicId, { page, size }),
    queryFn: () => topicAuthoringService.questions(topicId, { page, size }),
    enabled: Boolean(topicId),
    staleTime: QUESTIONS_STALE_MS,
  })
}

/** Signalements d'une question, chargés à l'ouverture du dialogue propriétaire. */
export function useQuestionReports(questionId: string | null) {
  return useQuery({
    queryKey: queryKeys.questions.reports(questionId ?? ""),
    queryFn: () => topicAuthoringService.reports(questionId as string),
    enabled: Boolean(questionId),
    staleTime: 10_000,
  })
}

/**
 * Clôture d'un signalement (unitaire) ou de tous les signalements ouverts d'une question.
 * Invalidation des questions du sujet après succès : les compteurs affichés changent.
 */
export function useResolveQuestionReports(topicId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      questionId,
      reportId,
      input,
    }: {
      questionId: string
      reportId?: string
      input: ResolveQuestionReportsInput
    }) =>
      reportId
        ? topicAuthoringService.resolveReport(questionId, reportId, input)
        : topicAuthoringService.resolveReports(questionId, input),
    onSuccess: () => {
      showSuccessToast(t("authoring.toasts.reportsResolved"))
      void queryClient.invalidateQueries({
        queryKey: ["topics", "questions", topicId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["questions", "reports"],
      })
    },
  })
}

/**
 * Invalidation **d'attente de projection** : ces mutations n'ont pas de patch optimiste (aucun
 * état à écraser), on diffère donc l'invalidation le temps que la projection Axon rattrape —
 * exception assumée de la règle de convergence (`best-practices/.frontend/server-state.md`,
 * section Mutations). À convertir en `reconcileUntil` dès qu'un read model exposable permet de
 * prédire l'état attendu.
 */
function invalidateTopicViews(queryClient: ReturnType<typeof useQueryClient>) {
  scheduleInvalidate(queryClient, [queryKeys.topics.all, queryKeys.home()])
}

export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTopicInput) =>
      topicAuthoringService.createTopic(input),
    onSuccess: () => {
      invalidateTopicViews(queryClient)
    },
  })
}

/** Patch du sujet : seuls les champs fournis partent (une commande par champ). */
export function useUpdateTopic(topicId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: TopicPatch) => {
      await Promise.all([
        ...(patch.nameUpdates ?? []).map((update) =>
          topicAuthoringService.updateName(
            topicId,
            update.language,
            update.name
          )
        ),
        patch.description !== undefined
          ? topicAuthoringService.updateDescription(topicId, patch.description)
          : Promise.resolve(),
        patch.category !== undefined
          ? topicAuthoringService.updateCategory(topicId, patch.category)
          : Promise.resolve(),
        patch.emoji !== undefined
          ? topicAuthoringService.updateEmoji(topicId, patch.emoji)
          : Promise.resolve(),
        patch.color !== undefined
          ? topicAuthoringService.updateColor(topicId, patch.color)
          : Promise.resolve(),
        patch.imageUrl !== undefined
          ? topicAuthoringService.updateImageUrl(topicId, patch.imageUrl)
          : Promise.resolve(),
        patch.bannerUrl !== undefined
          ? topicAuthoringService.updateBannerUrl(topicId, patch.bannerUrl)
          : Promise.resolve(),
      ])
    },
    onSuccess: () => {
      showSuccessToast(t("authoring.toasts.topicUpdated"))
      invalidateTopicViews(queryClient)
    },
  })
}

export function usePublishTopic(topicId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => topicAuthoringService.publish(topicId),
    onSuccess: () => {
      showSuccessToast(t("authoring.toasts.topicPublished"))
      invalidateTopicViews(queryClient)
    },
  })
}

/**
 * Enregistre une question : création complète, ou plan d'opérations par champ (seuls les champs
 * modifiés partent) pour une question existante.
 */
export function useSaveQuestion(topicId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      question: QuestionEditor | null
      draft: QuestionDraft
    }) => {
      if (!input.question) {
        await topicAuthoringService.createQuestion(
          topicId,
          toCreateInput(input.draft)
        )
        return
      }

      for (const operation of buildQuestionPlan(input.question, input.draft)) {
        switch (operation.kind) {
          case "create":
            await topicAuthoringService.createQuestion(
              topicId,
              operation.payload
            )
            break
          case "translation":
            await topicAuthoringService.addTranslation(
              input.question.questionId,
              operation.language,
              operation.text,
              operation.answers
            )
            break
          case "text":
            await topicAuthoringService.updateText(
              input.question.questionId,
              operation.language,
              operation.text
            )
            break
          case "answers":
            await topicAuthoringService.updateAnswers(
              input.question.questionId,
              operation.language,
              operation.answers
            )
            break
          case "correctAnswer":
            await topicAuthoringService.updateCorrectAnswer(
              input.question.questionId,
              operation.correctAnswer
            )
            break
          case "imageUrl":
            await topicAuthoringService.updateQuestionImageUrl(
              input.question.questionId,
              operation.imageUrl
            )
            break
        }
      }
    },
    onSuccess: (_data, variables) => {
      showSuccessToast(
        variables.question
          ? t("authoring.toasts.questionUpdated")
          : t("authoring.toasts.questionAdded")
      )
      invalidateTopicViews(queryClient)
    },
  })
}

export function useModerateQuestion() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      questionId: string
      action: "approve" | "reject"
      reason?: string
    }) => {
      if (input.action === "approve") {
        await topicAuthoringService.approve(input.questionId)
      } else {
        await topicAuthoringService.reject(input.questionId, input.reason)
      }
    },
    onSuccess: (_data, variables) => {
      showSuccessToast(
        variables.action === "approve"
          ? t("authoring.toasts.questionApproved")
          : t("authoring.toasts.questionRejected")
      )
      invalidateTopicViews(queryClient)
    },
  })
}
