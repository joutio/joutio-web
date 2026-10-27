/** Motifs de signalement d'une question (contrat BFF). */
export type QuestionReportReason = "QUESTION" | "IMAGE" | "ANSWERS"

export interface ReportQuestionInput {
  gameId: string
  reasons: QuestionReportReason[]
  comment?: string
  language?: string
}

export interface QuestionReportAck {
  reportId: string
  status: "OPEN"
  createdAt: string
  created: boolean
}
