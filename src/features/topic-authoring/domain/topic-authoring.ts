import type { Language } from "@/features/player/domain/profile"

/** Choix de réponse d'une question (enum backend `QuestionChoice`). */
export type QuestionChoice = "A" | "B" | "C" | "D"

/** Statut de modération d'une question (enum backend `QuestionStatus`). */
export type QuestionStatus = "PENDING" | "APPROVED" | "REJECTED"

/** Difficulté déduite d'une question (`null` tant que l'échantillon est insuffisant). */
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT" | null

/** Motif d'un signalement (enum backend `QuestionReportReason`). */
export type QuestionReportReason = "QUESTION" | "IMAGE" | "ANSWERS"

/** État d'un signalement (enum backend `QuestionReportStatus`). */
export type QuestionReportStatus = "OPEN" | "RESOLVED" | "DISMISSED"

/** Décision de clôture d'un signalement. */
export type QuestionReportResolution = "RESOLVED" | "DISMISSED"

/** Origine d'une suspension (enum backend `QuestionSuspensionReason`). */
export type QuestionSuspensionReason = "AUTO_REPORT_THRESHOLD" | "MANUAL"

/** Réponse d'un contenu localisé (`QuestionEditorView.AnswerView`). */
export interface QuestionAnswer {
  choice: QuestionChoice
  text: string
}

/** Contenu localisé d'une question (`QuestionEditorView.ContentView`). */
export interface QuestionContent {
  language: Language
  text: string
  answers: QuestionAnswer[]
}

/** Question vue par son auteur (`QuestionEditorView`). */
export interface QuestionEditor {
  questionId: string
  contents: QuestionContent[]
  correctAnswer: QuestionChoice
  imageUrl: string | null
  status: QuestionStatus
  difficulty: QuestionDifficulty
  suspended: boolean
  suspensionReason: QuestionSuspensionReason | null
  suspensionNote: string | null
  suspendedAt: string | null
  reinstatedAt: string | null
  archived: boolean
  archiveNote: string | null
  archivedAt: string | null
  restoredAt: string | null
  openReportCount: number
  totalReportCount: number
  lastReportedAt: string | null
  createdAt: string
  updatedAt: string | null
}

/** Contenu figé d'une question au moment du signalement. */
export interface QuestionReportSnapshot {
  questionText: string
  imageUrl: string | null
  answers: { choice: string; text: string }[]
  translations: {
    language: Language
    text: string
    answers: { choice: string; text: string }[]
  }[]
  correctAnswer: string | null
  language: string | null
  source: "PLAYED" | "CURRENT" | null
}

/** Signalement vu par le propriétaire du sujet (sans identité du signalant). */
export interface OwnerQuestionReport {
  reportId: string
  reasons: QuestionReportReason[]
  comment: string | null
  language: Language | null
  snapshot: QuestionReportSnapshot | null
  status: QuestionReportStatus
  createdAt: string
  reviewedAt: string | null
  resolutionNote: string | null
}

export interface ResolveQuestionReportsInput {
  resolution: QuestionReportResolution
  note?: string
}

/** Création d'un sujet (brouillon). `names.fr` obligatoire, `names.en` optionnel. */
export interface CreateTopicInput {
  names: { fr: string; en?: string }
  description?: string | null
  category: string
  emoji?: string | null
  color?: string | null
  imageUrl?: string | null
}

/** Mise à jour d'un nom de sujet pour une langue donnée. */
export interface TopicNameUpdate {
  language: Language
  name: string
}

/** Patch champ par champ d'un sujet — seuls les champs fournis sont envoyés. */
export interface TopicPatch {
  nameUpdates?: TopicNameUpdate[]
  description?: string | null
  category?: string
  emoji?: string | null
  color?: string | null
  imageUrl?: string | null
  bannerUrl?: string | null
}

/** Création d'une question (contenus localisés + bonne réponse + illustration). */
export interface CreateQuestionInput {
  contents: {
    language: Language
    text: string
    answers: QuestionAnswer[]
  }[]
  correctAnswer: QuestionChoice
  imageUrl?: string | null
}

const LANGUAGE_ORDER: Language[] = ["fr", "en"]

export function sortContents(contents: QuestionContent[]): QuestionContent[] {
  return [...contents].sort(
    (a, b) =>
      LANGUAGE_ORDER.indexOf(a.language) - LANGUAGE_ORDER.indexOf(b.language)
  )
}

export function contentFor(
  question: QuestionEditor,
  language: Language
): QuestionContent | null {
  return (
    question.contents.find((content) => content.language === language) ?? null
  )
}
