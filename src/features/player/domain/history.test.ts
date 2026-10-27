import { describe, expect, it } from "vitest"
import {
  isFinishedOutcome,
  isGameHistorySort,
  isGameOpponentTypeFilter,
  isGameOutcomeFilter,
} from "./history"

describe("isFinishedOutcome", () => {
  it("reconnaît les parties au bilan définitif", () => {
    expect(isFinishedOutcome("WIN")).toBe(true)
    expect(isFinishedOutcome("LOSS")).toBe(true)
    expect(isFinishedOutcome("DRAW")).toBe(true)
  })

  it("exclut les parties sans bilan sportif", () => {
    expect(isFinishedOutcome("WAITING")).toBe(false)
    expect(isFinishedOutcome("IN_PROGRESS")).toBe(false)
    expect(isFinishedOutcome("CANCELLED")).toBe(false)
  })
})

describe("gardes des filtres d'historique", () => {
  it("accepte les valeurs connues", () => {
    expect(isGameOutcomeFilter("WIN")).toBe(true)
    expect(isGameOutcomeFilter("ALL")).toBe(true)
    expect(isGameOpponentTypeFilter("BOT")).toBe(true)
    expect(isGameHistorySort("SCORE")).toBe(true)
  })

  it("rejette les valeurs d'URL inconnues ou absentes", () => {
    expect(isGameOutcomeFilter("BOGUS")).toBe(false)
    expect(isGameOutcomeFilter(null)).toBe(false)
    expect(isGameOpponentTypeFilter("ALLIES")).toBe(false)
    expect(isGameHistorySort("xp")).toBe(false)
  })
})
