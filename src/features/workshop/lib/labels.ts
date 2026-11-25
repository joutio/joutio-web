import type { QuestionReportReason } from '@joutio/client/authoring'
import type { QuestionStatus } from '@joutio/client/authoring'
import type { MessageKey } from '@/lib/i18n'

/** Motifs d'un signalement de question, traduits (« L'énoncé », « L'image », « Les réponses »). */
export const REASON_LABEL: Record<QuestionReportReason, MessageKey> = {
  QUESTION: 'workshop.reasonQuestion',
  IMAGE: 'workshop.reasonImage',
  ANSWERS: 'workshop.reasonAnswers',
  COPYRIGHT: 'workshop.reasonCopyright',
}

/** Statut d'une question, en toutes lettres (`creation.md` § 1). */
export const STATUS_LABEL: Record<QuestionStatus, MessageKey> = {
  approved: 'workshop.statusApproved',
  pending: 'workshop.statusPending',
  rejected: 'workshop.statusRejected',
  suspended: 'workshop.statusSuspended',
  archived: 'workshop.statusArchived',
}
