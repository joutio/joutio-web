import { describe, expect, it } from "vitest"
import type { QuestionEditor } from "../domain/topic-authoring"
import {
  buildQuestionPlan,
  draftErrors,
  draftFromQuestion,
  emptyDraft,
  toCreateInput,
  type DraftError,
  type QuestionDraft,
} from "./question-draft"

function filledDraft(): QuestionDraft {
  const draft = emptyDraft()
  draft.fr.text = "Capitale de la France ?"
  draft.fr.answers = { A: "Paris", B: "Lyon", C: "Marseille", D: "Lille" }
  return draft
}

function question(overrides: Partial<QuestionEditor> = {}): QuestionEditor {
  return {
    questionId: "question-1",
    contents: [
      {
        language: "fr",
        text: "Capitale de la France ?",
        answers: [
          { choice: "A", text: "Paris" },
          { choice: "B", text: "Lyon" },
          { choice: "C", text: "Marseille" },
          { choice: "D", text: "Lille" },
        ],
      },
    ],
    correctAnswer: "A",
    imageUrl: null,
    status: "PENDING",
    difficulty: null,
    suspended: false,
    suspensionReason: null,
    suspensionNote: null,
    suspendedAt: null,
    reinstatedAt: null,
    archived: false,
    archiveNote: null,
    archivedAt: null,
    restoredAt: null,
    openReportCount: 0,
    totalReportCount: 0,
    lastReportedAt: null,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: null,
    ...overrides,
  }
}

function errorKeys(errors: DraftError[]): string[] {
  return errors.map((error) => error.key)
}

describe("draftErrors", () => {
  it("exige le texte et les 4 réponses en français", () => {
    const errors = errorKeys(draftErrors(emptyDraft()))

    expect(errors).toContain("authoring.editor.errors.textRequiredFr")
    expect(errors).toContain("authoring.editor.errors.answersRequiredFr")
  })

  it("valide l'anglais seulement quand il est activé", () => {
    const draft = filledDraft()
    expect(draftErrors(draft)).toEqual([])

    draft.en.enabled = true
    const errors = errorKeys(draftErrors(draft))
    expect(errors).toContain("authoring.editor.errors.textRequiredEn")
  })

  it("refuse une URL d'image non http(s)", () => {
    const draft = filledDraft()
    draft.imageUrl = "ftp://example.com/img.png"

    expect(errorKeys(draftErrors(draft))).toContain(
      "authoring.editor.errors.imageUrlProtocol"
    )
  })
})

describe("toCreateInput", () => {
  it("ne porte que le français par défaut", () => {
    const input = toCreateInput(filledDraft())

    expect(input.contents).toHaveLength(1)
    expect(input.contents[0].language).toBe("fr")
    expect(input.contents[0].answers).toHaveLength(4)
  })

  it("ajoute l'anglais quand il est activé", () => {
    const draft = filledDraft()
    draft.en.enabled = true
    draft.en.text = "What is the capital of France?"
    draft.en.answers = { A: "Paris", B: "Lyon", C: "Marseille", D: "Lille" }

    const input = toCreateInput(draft)

    expect(input.contents.map((content) => content.language)).toEqual([
      "fr",
      "en",
    ])
  })
})

describe("buildQuestionPlan", () => {
  it("crée la question quand il n'y a pas d'original", () => {
    const plan = buildQuestionPlan(null, filledDraft())

    expect(plan).toHaveLength(1)
    expect(plan[0].kind).toBe("create")
  })

  it("n'envoie que les champs modifiés", () => {
    const original = question()
    const draft = draftFromQuestion(original)
    draft.fr.text = "Quelle est la capitale de la France ?"

    const plan = buildQuestionPlan(original, draft)

    expect(plan).toEqual([
      {
        kind: "text",
        language: "fr",
        text: "Quelle est la capitale de la France ?",
      },
    ])
  })

  it("émet une traduction complète pour une langue nouvelle", () => {
    const original = question()
    const draft = draftFromQuestion(original)
    draft.en.enabled = true
    draft.en.text = "What is the capital of France?"
    draft.en.answers = { A: "Paris", B: "Lyon", C: "Marseille", D: "Lille" }

    const plan = buildQuestionPlan(original, draft)

    expect(plan).toHaveLength(1)
    expect(plan[0].kind).toBe("translation")
  })

  it("détecte la bonne réponse et l'image", () => {
    const original = question()
    const draft = draftFromQuestion(original)
    draft.correctAnswer = "B"
    draft.imageUrl = "https://example.com/france.png"

    const plan = buildQuestionPlan(original, draft)

    expect(plan).toContainEqual({ kind: "correctAnswer", correctAnswer: "B" })
    expect(plan).toContainEqual({
      kind: "imageUrl",
      imageUrl: "https://example.com/france.png",
    })
  })

  it("ne produit aucune opération sans modification", () => {
    const original = question()

    expect(buildQuestionPlan(original, draftFromQuestion(original))).toEqual([])
  })
})
