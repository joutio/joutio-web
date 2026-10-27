import type { Language } from "@/features/player/domain/profile"
import type { TranslationKey } from "@/lib/i18n/types"
import type {
  CreateQuestionInput,
  QuestionAnswer,
  QuestionChoice,
  QuestionEditor,
} from "../domain/topic-authoring"
import { contentFor } from "../domain/topic-authoring"

export const QUESTION_CHOICES: QuestionChoice[] = ["A", "B", "C", "D"]
export const MAX_QUESTION_TEXT = 255
export const MAX_IMAGE_URL = 1024

/** Brouillon d'un contenu localisé (les réponses sont indexées par choix pour le formulaire). */
export interface ContentDraft {
  enabled: boolean
  text: string
  answers: Record<QuestionChoice, string>
}

/** Brouillon complet d'une question (création ou édition), FR requis + EN optionnel. */
export interface QuestionDraft {
  fr: ContentDraft
  en: ContentDraft
  correctAnswer: QuestionChoice
  imageUrl: string
}

function emptyAnswers(): Record<QuestionChoice, string> {
  return { A: "", B: "", C: "", D: "" }
}

function emptyContent(enabled: boolean): ContentDraft {
  return { enabled, text: "", answers: emptyAnswers() }
}

export function emptyDraft(): QuestionDraft {
  return {
    fr: emptyContent(true),
    en: emptyContent(false),
    correctAnswer: "A",
    imageUrl: "",
  }
}

function toContentDraft(
  content: ReturnType<typeof contentFor>,
  enabled: boolean
): ContentDraft {
  if (!content) {
    return emptyContent(enabled)
  }
  const answers = emptyAnswers()
  for (const answer of content.answers) {
    answers[answer.choice] = answer.text
  }
  return { enabled, text: content.text, answers }
}

export function draftFromQuestion(question: QuestionEditor): QuestionDraft {
  return {
    fr: toContentDraft(contentFor(question, "fr"), true),
    en: toContentDraft(contentFor(question, "en"), false),
    correctAnswer: question.correctAnswer,
    imageUrl: question.imageUrl ?? "",
  }
}

function normalizedImageUrl(draft: QuestionDraft): string | null {
  const value = draft.imageUrl.trim()
  return value === "" ? null : value
}

function enabledLanguages(draft: QuestionDraft): Language[] {
  return draft.en && draft.en.enabled ? ["fr", "en"] : ["fr"]
}

function answersOf(content: ContentDraft): QuestionAnswer[] {
  return QUESTION_CHOICES.map((choice) => ({
    choice,
    text: content.answers[choice].trim(),
  }))
}

const TEXT_REQUIRED_KEYS: Record<Language, TranslationKey> = {
  fr: "authoring.editor.errors.textRequiredFr",
  en: "authoring.editor.errors.textRequiredEn",
}

const TEXT_TOO_LONG_KEYS: Record<Language, TranslationKey> = {
  fr: "authoring.editor.errors.textTooLongFr",
  en: "authoring.editor.errors.textTooLongEn",
}

const ANSWERS_REQUIRED_KEYS: Record<Language, TranslationKey> = {
  fr: "authoring.editor.errors.answersRequiredFr",
  en: "authoring.editor.errors.answersRequiredEn",
}

/** Erreur de validation portée par une clé i18n (traduite au rendu). */
export interface DraftError {
  key: TranslationKey
  options?: { max: number }
}

export function draftErrors(draft: QuestionDraft): DraftError[] {
  const errors: DraftError[] = []

  for (const language of enabledLanguages(draft)) {
    const content = draft[language]
    const text = content.text.trim()
    if (!text) {
      errors.push({ key: TEXT_REQUIRED_KEYS[language] })
    } else if (text.length > MAX_QUESTION_TEXT) {
      errors.push({
        key: TEXT_TOO_LONG_KEYS[language],
        options: { max: MAX_QUESTION_TEXT },
      })
    }
    if (QUESTION_CHOICES.some((choice) => !content.answers[choice].trim())) {
      errors.push({ key: ANSWERS_REQUIRED_KEYS[language] })
    }
  }

  const imageUrl = draft.imageUrl.trim()
  if (imageUrl) {
    if (imageUrl.length > MAX_IMAGE_URL) {
      errors.push({
        key: "authoring.editor.errors.imageUrlTooLong",
        options: { max: MAX_IMAGE_URL },
      })
    } else if (!/^https?:\/\/.+/.test(imageUrl)) {
      errors.push({ key: "authoring.editor.errors.imageUrlProtocol" })
    }
  }

  return errors
}

export function toCreateInput(draft: QuestionDraft): CreateQuestionInput {
  return {
    contents: enabledLanguages(draft).map((language) => ({
      language,
      text: draft[language].text.trim(),
      answers: answersOf(draft[language]),
    })),
    correctAnswer: draft.correctAnswer,
    imageUrl: normalizedImageUrl(draft),
  }
}

/**
 * Opérations d'édition d'une question existante : seuls les champs modifiés sont envoyés
 * (une commande par champ côté BFF ; une langue nouvelle passe par une traduction complète).
 */
export type QuestionOperation =
  | { kind: "create"; payload: CreateQuestionInput }
  | {
      kind: "translation"
      language: Language
      text: string
      answers: QuestionAnswer[]
    }
  | { kind: "text"; language: Language; text: string }
  | { kind: "answers"; language: Language; answers: QuestionAnswer[] }
  | { kind: "correctAnswer"; correctAnswer: QuestionChoice }
  | { kind: "imageUrl"; imageUrl: string | null }

function sameAnswers(
  answers: QuestionAnswer[],
  original: QuestionAnswer[]
): boolean {
  if (answers.length !== original.length) {
    return false
  }
  return answers.every((answer) => {
    const match = original.find(
      (candidate) => candidate.choice === answer.choice
    )
    return match?.text === answer.text
  })
}

export function buildQuestionPlan(
  original: QuestionEditor | null,
  draft: QuestionDraft
): QuestionOperation[] {
  if (!original) {
    return [{ kind: "create", payload: toCreateInput(draft) }]
  }

  const operations: QuestionOperation[] = []

  for (const language of enabledLanguages(draft)) {
    const content = contentFor(original, language)
    const text = draft[language].text.trim()
    const answers = answersOf(draft[language])

    if (!content) {
      operations.push({ kind: "translation", language, text, answers })
      continue
    }
    if (content.text !== text) {
      operations.push({ kind: "text", language, text })
    }
    if (!sameAnswers(answers, content.answers)) {
      operations.push({ kind: "answers", language, answers })
    }
  }

  if (original.correctAnswer !== draft.correctAnswer) {
    operations.push({
      kind: "correctAnswer",
      correctAnswer: draft.correctAnswer,
    })
  }

  const imageUrl = normalizedImageUrl(draft)
  if ((original.imageUrl ?? null) !== imageUrl) {
    operations.push({ kind: "imageUrl", imageUrl })
  }

  return operations
}
