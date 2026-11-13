import type { IdResponse, Language, PageResponse, SuggestionView, TopicCardView } from '@joutio/client-domain/api-types'
import type { QuestionEditorView, QuestionOperation, ReportDetail, ReportedQuestion, TeamMember, TeamRole, TopicTitles, TopicTodo, TopicWorkshop } from '@joutio/client-domain/authoring'
import { api } from '@/lib/api'

const id = encodeURIComponent

/** Taille de page de `GET /api/topics/{id}/questions` (plafond BFF : 100). */
const QUESTIONS_PAGE = 100

export const WORKSHOP_ENDPOINTS = {
  topics: '/api/topics',
  contributed: '/api/topics/contributed',
  todo: '/api/topics/contributed/todo',
  topic: (topicId: string) => `/api/topics/${id(topicId)}`,
  workshop: (topicId: string) => `/api/topics/${id(topicId)}/workshop`,
  field: (topicId: string, field: 'name' | 'description' | 'category' | 'image-url' | 'pictogram-url' | 'titles' | 'publish' | 'draft' | 'questions' | 'team') => `/api/topics/${id(topicId)}/${field}`,
  member: (topicId: string, userId: string) => `/api/topics/${id(topicId)}/team/${id(userId)}`,
  question: (questionId: string, action?: string) => `/api/questions/${id(questionId)}${action ? `/${action}` : ''}`,
  reportQueue: (topicId: string) => `/api/question-reports/topics/${id(topicId)}`,
  reportDetail: (reportId: string) => `/api/question-reports/${id(reportId)}`,
  suggestions: '/api/suggestions',
} as const

/** Écritures d'auteur (`creation.md` § 5, repris du mobile) : sujets champ par champ, questions, modération, équipe. */
export const workshopService = {
  /** Mes sujets, brouillons et publiés. */
  myTopics: () => api.get<PageResponse<TopicCardView>>(WORKSHOP_ENDPOINTS.contributed, { query: { page: 0, size: 100 } }),
  /** Sujets dont je suis le créateur (`mine=true`, exclusif des autres filtres). */
  createdTopics: () => api.get<PageResponse<TopicCardView>>(WORKSHOP_ENDPOINTS.topics, { query: { mine: true, page: 0, size: 100 } }),
  /** Mes sujets › À traiter. */
  todo: () => api.get<TopicTodo[]>(WORKSHOP_ENDPOINTS.todo),
  workshop: (topicId: string) => api.get<TopicWorkshop>(WORKSHOP_ENDPOINTS.workshop(topicId)),

  createTopic: (name: string, category: string) => api.post<IdResponse>(WORKSHOP_ENDPOINTS.topics, { names: { fr: name }, category }),
  updateName: (topicId: string, language: Language, name: string) => api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'name'), { language, name }),
  updateCategory: (topicId: string, category: string) => api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'category'), { category }),
  updateImageUrl: (topicId: string, imageUrl: string | null) => api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'image-url'), { imageUrl }),
  updatePictogramUrl: (topicId: string, pictogramUrl: string | null) => api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'pictogram-url'), { pictogramUrl }),
  /** Description du sujet, affichée sous le titre de la fiche ; `null` l'efface. */
  updateDescription: (topicId: string, description: string | null, language: 'fr' | 'en') =>
    api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'description'), { description, language: language.toUpperCase() }),
  /** Titres par palier ; `null` efface tout (repli « Or · Sujet »). */
  updateTitles: (topicId: string, titles: TopicTitles | null) => api.put<void>(WORKSHOP_ENDPOINTS.field(topicId, 'titles'), { titles }),
  publish: (topicId: string) => api.post<void>(WORKSHOP_ENDPOINTS.field(topicId, 'publish')),
  /** Repasse un sujet publié en brouillon. */
  draft: (topicId: string) => api.post<void>(WORKSHOP_ENDPOINTS.field(topicId, 'draft')),
  /** Supprime un brouillon (créateur seul) ; ses questions partent avec lui. */
  deleteTopic: (topicId: string) => api.delete<void>(WORKSHOP_ENDPOINTS.topic(topicId)),

  /** Toutes les questions du sujet (150 au plus) : recherche, tri et filtres se font dans l'app, le BFF n'en a pas. */
  async questions(topicId: string): Promise<QuestionEditorView[]> {
    const all: QuestionEditorView[] = []
    for (let page = 0; ; page += 1) {
      const result = await api.get<PageResponse<QuestionEditorView>>(WORKSHOP_ENDPOINTS.field(topicId, 'questions'), { query: { page, size: QUESTIONS_PAGE } })
      all.push(...result.content)
      if (result.last || result.content.length === 0) return all
    }
  },

  /** Envoie les opérations dans l'ordre ; renvoie l'identifiant de la question (créée ou modifiée). */
  async saveQuestion(topicId: string, questionId: string | undefined, operations: readonly QuestionOperation[]): Promise<string> {
    let current = questionId
    const completed: QuestionOperation[] = []
    try {
      for (const operation of operations) {
        const q = current ?? ''
        switch (operation.kind) {
          case 'create':
            current = (await api.post<IdResponse>(WORKSHOP_ENDPOINTS.field(topicId, 'questions'), operation.payload)).id
            break
          case 'translation':
            await api.post<void>(WORKSHOP_ENDPOINTS.question(q, 'translations'), { language: operation.language, text: operation.text, answers: operation.answers })
            break
          case 'text':
            await api.put<void>(WORKSHOP_ENDPOINTS.question(q, 'text'), { language: operation.language, text: operation.text })
            break
          case 'answers':
            await api.put<void>(WORKSHOP_ENDPOINTS.question(q, 'answers'), { language: operation.language, answers: operation.answers })
            break
          case 'correctAnswer':
            await api.put<void>(WORKSHOP_ENDPOINTS.question(q, 'correct-answer'), { correctAnswer: operation.correctAnswer })
            break
          case 'imageUrl':
            await api.put<void>(WORKSHOP_ENDPOINTS.question(q, 'image-url'), { imageUrl: operation.imageUrl })
            break
        }
        completed.push(operation)
      }
      // Une question modifiée repart en validation.
      if (questionId && operations.length > 0) await api.post<void>(WORKSHOP_ENDPOINTS.question(questionId, 'resubmit'))
    } catch (cause) {
      throw Object.assign(new Error('partial question save', { cause }), { questionId: current, completedOperations: completed })
    }
    return current ?? ''
  },

  approve: (questionId: string) => api.post<void>(WORKSHOP_ENDPOINTS.question(questionId, 'approve')),
  reject: (questionId: string, reason: string) => api.post<void>(WORKSHOP_ENDPOINTS.question(questionId, 'reject'), { reason }),
  archive: (questionId: string) => api.post<void>(WORKSHOP_ENDPOINTS.question(questionId, 'archive')),
  restore: (questionId: string) => api.post<void>(WORKSHOP_ENDPOINTS.question(questionId, 'restore')),
  deleteQuestion: (questionId: string) => api.delete<void>(WORKSHOP_ENDPOINTS.question(questionId)),

  /** File des signalements ouverts du sujet, une entrée par question. */
  reportQueue: (topicId: string) => api.get<ReportedQuestion[]>(WORKSHOP_ENDPOINTS.reportQueue(topicId)),
  /** Un signalement (ouverture depuis une notification) : sa question. */
  reportDetail: (reportId: string) => api.get<ReportDetail>(WORKSHOP_ENDPOINTS.reportDetail(reportId)),
  /** Clôt tous les signalements ouverts d'une question : `RESOLVED` après modification, `DISMISSED` sinon. */
  resolveReports: (questionId: string, resolution: 'RESOLVED' | 'DISMISSED') => api.post<{ resolvedCount: number }>(WORKSHOP_ENDPOINTS.question(questionId, 'reports/resolve'), { resolution }),

  team: (topicId: string) => api.get<TeamMember[]>(WORKSHOP_ENDPOINTS.field(topicId, 'team')),
  setMember: (topicId: string, userId: string, role: TeamRole) => api.put<TeamMember>(WORKSHOP_ENDPOINTS.member(topicId, userId), { role }),
  removeMember: (topicId: string, userId: string) => api.delete<void>(WORKSHOP_ENDPOINTS.member(topicId, userId)),
  /** Joueurs à inviter : la recherche globale, joueurs seulement. */
  players: (query: string) => api.get<SuggestionView[]>(WORKSHOP_ENDPOINTS.suggestions, { query: { q: query, limit: 20 } }),
}

/** Numéro d'une question dans son sujet : son rang de création (1 pour la plus ancienne). */
export function questionNumber(questions: readonly QuestionEditorView[], questionId: string) {
  return [...questions].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((question) => question.questionId === questionId) + 1
}
