// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerTitles } from "../domain/progression"

const equip = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))

vi.mock("../hooks/useEquipTitle", () => ({ useEquipTitle: () => equip }))
vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: Record<string, string> | null | undefined) =>
    names?.fr ?? "",
}))

import { TitleSection } from "./TitleSection"

const UNLOCKED = {
  key: "topic-a:OR",
  topicId: "topic-a",
  tier: "OR" as const,
  tierProgressPercent: 30,
  tierRemainingXp: 2_750,
  nextTier: "PLATINE" as const,
  topic: {
    topicId: "topic-a",
    names: { fr: "Histoire" },
    category: null,
    emoji: "🏛️",
    color: null,
    imageUrl: null,
    titles: null,
  },
}

const WITH_TITLE: PlayerTitles = {
  equippedKey: "topic-a:OR",
  titles: [UNLOCKED],
}

const WITHOUT_TITLE: PlayerTitles = {
  equippedKey: null,
  titles: [UNLOCKED],
}

function renderSection(titles: PlayerTitles) {
  return render(
    <MemoryRouter>
      <TitleSection userId="u1" titles={titles} />
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  equip.mutate.mockClear()
})

describe("TitleSection", () => {
  it("avec titre : libellé composé, rareté et retrait uniquement", async () => {
    const user = userEvent.setup()
    renderSection(WITH_TITLE)

    expect(screen.getByText("Or · Histoire")).toBeInTheDocument()
    expect(screen.queryByText("Novice")).toBeNull()
    // Le rang affiché est le palier de rareté du titre (Or).
    expect(screen.getByText("Or")).toHaveAttribute("data-rank", "OR")
    // Le choix d'un titre n'est plus proposé dans les Réglages.
    expect(
      screen.queryByRole("button", { name: "Choisir un titre" })
    ).toBeNull()

    await user.click(screen.getByRole("button", { name: "Retirer le titre" }))
    expect(equip.mutate).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it("sans titre : invite affichée, aucun retrait proposé", () => {
    renderSection(WITHOUT_TITLE)

    expect(screen.getByText("Aucun titre affiché")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Retirer le titre" })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Choisir un titre" })
    ).toBeNull()
  })

  it("renvoie vers le catalogue pour choisir un titre dans l'onglet du sujet", () => {
    renderSection(WITHOUT_TITLE)

    expect(
      screen.getByText(/Pour choisir un titre, ouvre un sujet/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Parcourir les sujets" })
    ).toHaveAttribute("href", "/topics")
  })
})
