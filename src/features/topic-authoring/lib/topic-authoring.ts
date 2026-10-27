import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { IdResponse, Page } from "@/shared/types/api"
import type {
  CreateQuestionInput,
  CreateTopicInput,
  OwnerQuestionReport,
  QuestionAnswer,
  QuestionChoice,
  QuestionEditor,
  ResolveQuestionReportsInput,
} from "../domain/topic-authoring"
import type { Language } from "@/features/player/domain/profile"

/** Écritures d'auteur : sujets (champ par champ), questions et modération. */
export const topicAuthoringService = {
  createTopic: (input: CreateTopicInput): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.topics.create, input),

  updateName: (
    topicId: string,
    language: Language,
    name: string
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.name(topicId), { language, name }),

  updateDescription: (
    topicId: string,
    description: string | null
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.description(topicId), { description }),

  updateCategory: (topicId: string, category: string): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.category(topicId), { category }),

  updateEmoji: (topicId: string, emoji: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.emoji(topicId), { emoji }),

  updateColor: (topicId: string, color: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.color(topicId), { color }),

  updateImageUrl: (topicId: string, imageUrl: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.imageUrl(topicId), { imageUrl }),

  updateBannerUrl: (topicId: string, bannerUrl: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.bannerUrl(topicId), { bannerUrl }),

  publish: (topicId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.topics.publish(topicId)),

  questions: (
    topicId: string,
    params: { page: number; size: number }
  ): Promise<Page<QuestionEditor>> =>
    api.get<Page<QuestionEditor>>(ENDPOINTS.topics.questions(topicId), {
      params,
    }),

  createQuestion: (
    topicId: string,
    input: CreateQuestionInput
  ): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.topics.questions(topicId), input),

  addTranslation: (
    questionId: string,
    language: Language,
    text: string,
    answers: QuestionAnswer[]
  ): Promise<void> =>
    api.post<void>(ENDPOINTS.questions.translations(questionId), {
      language,
      text,
      answers,
    }),

  updateText: (
    questionId: string,
    language: Language,
    text: string
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.questions.text(questionId), { language, text }),

  updateAnswers: (
    questionId: string,
    language: Language,
    answers: QuestionAnswer[]
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.questions.answers(questionId), {
      language,
      answers,
    }),

  updateCorrectAnswer: (
    questionId: string,
    correctAnswer: QuestionChoice
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.questions.correctAnswer(questionId), {
      correctAnswer,
    }),

  updateQuestionImageUrl: (
    questionId: string,
    imageUrl: string | null
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.questions.imageUrl(questionId), { imageUrl }),

  approve: (questionId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.questions.approve(questionId)),

  reject: (questionId: string, reason?: string): Promise<void> =>
    api.post<void>(ENDPOINTS.questions.reject(questionId), {
      reason: reason ?? null,
    }),

  reports: (questionId: string): Promise<OwnerQuestionReport[]> =>
    api.get<OwnerQuestionReport[]>(ENDPOINTS.questions.reports(questionId)),

  resolveReport: (
    questionId: string,
    reportId: string,
    input: ResolveQuestionReportsInput
  ): Promise<{ resolvedCount: number }> =>
    api.post<{ resolvedCount: number }>(
      ENDPOINTS.questions.reportResolve(questionId, reportId),
      input
    ),

  resolveReports: (
    questionId: string,
    input: ResolveQuestionReportsInput
  ): Promise<{ resolvedCount: number }> =>
    api.post<{ resolvedCount: number }>(
      ENDPOINTS.questions.reportResolveAll(questionId),
      input
    ),
}
