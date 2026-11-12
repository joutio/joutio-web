import type { IdResponse, QuestionReportReason, UserReportReason } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

const id = encodeURIComponent

/** Revanche et signalements depuis le résultat d'un duel. */
export const resultService = {
  /** Revanche : défi nominatif portant la partie d'origine (échéance courte côté serveur). */
  rematch: (topicId: string, opponentId: string, gameId: string) => api.post<IdResponse>('/api/challenges', { topicId, opponentId, gameId }),
  reportPlayer: (userId: string, body: { reasons: UserReportReason[]; comment?: string; gameId?: string }) =>
    api.post<unknown>(`/api/profiles/${id(userId)}/reports`, body),
  reportQuestion: (questionId: string, body: { gameId: string; reasons: QuestionReportReason[]; comment?: string; language: string }) =>
    api.post<unknown>(`/api/questions/${id(questionId)}/reports`, body),
}
