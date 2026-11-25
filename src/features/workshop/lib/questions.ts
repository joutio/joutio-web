import type { QuestionEditorView } from '@joutio/client/authoring'

/** Numéro d'une question dans son sujet : son rang de création (1 pour la plus ancienne). */
export function questionNumber(questions: readonly QuestionEditorView[], questionId: string) {
  return [...questions].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((question) => question.questionId === questionId) + 1
}
