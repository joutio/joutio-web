export type UserReportReason =
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "INAPPROPRIATE_CONTENT"
  | "CHEATING"
  | "SPAM"
  | "OTHER"

export interface ReportUserInput {
  reasons: UserReportReason[]
  comment?: string
  gameId?: string
}

export interface UserReportAck {
  reportId: string
  status: "OPEN"
  createdAt: string
  created: boolean
}
