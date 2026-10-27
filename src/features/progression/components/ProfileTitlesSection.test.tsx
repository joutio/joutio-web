// @vitest-environment jsdom
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerTitles } from "../domain/progression"

const equip = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
vi.mock("../hooks/useEquipTitle", () => ({ useEquipTitle: () => equip }))
vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  useTopicName: () => (names: Record<string, string> | null | undefined) =>
    names?.fr ?? "",
}))

import { ProfileTitlesSection } from "./ProfileTitlesSection"

const topic = {
  topicId: "topic-a",
  names: { fr: "Histoire" },
  category: null,
  emoji: "🏛️",
  color: null,
  imageUrl: null,
  titles: null,
}

const titles: PlayerTitles = {
  equippedKey: "topic-a:OR",
  titles: [
    {
      key: "topic-a:OR",
      topicId: "topic-a",
      tier: "OR",
      tierProgressPercent: 30,
      tierRemainingXp: 2_750,
      nextTier: "PLATINE",
      topic,
    },
    {
      key: "topic-b:FER",
      topicId: "topic-b",
      tier: "FER",
      tierProgressPercent: 0,
      tierRemainingXp: 500,
      nextTier: "BRONZE",
      topic: { ...topic, topicId: "topic-b", names: { fr: "Sport" } },
    },
  ],
}

function renderSection(initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ProfileTitlesSection userId="u1" titles={titles} />
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  equip.mutate.mockClear()
})

describe("ProfileTitlesSection", () => {
  it("liste les titres du rang le plus rare au plus commun", () => {
    renderSection()

    expect(
      screen.getByRole("button", { name: "Or · Histoire" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Fer · Sport" })
    ).toBeInTheDocument()
    expect(screen.getByText("Affiché")).toBeInTheDocument()
    expect(screen.getByText("Rareté : Or")).toBeInTheDocument()
  })

  it("retire le titre porté et équipe un autre titre", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(screen.getByRole("button", { name: "Retirer le titre" }))
    expect(equip.mutate).toHaveBeenCalledWith(null, expect.any(Object))

    await user.click(screen.getByRole("button", { name: "Utiliser ce titre" }))
    expect(equip.mutate).toHaveBeenCalledWith("topic-b:FER", expect.any(Object))
  })

  it("recherche un titre par le nom de son sujet", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.type(
      screen.getByPlaceholderText("Rechercher un titre…"),
      "Sport"
    )

    expect(
      screen.queryByRole("button", { name: "Or · Histoire" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Fer · Sport" })
    ).toBeInTheDocument()
  })

  it("restaure le filtre de rang depuis l'URL", () => {
    renderSection(["/?titleRank=OR"])

    expect(
      screen.getByRole("button", { name: "Or · Histoire" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Fer · Sport" })
    ).not.toBeInTheDocument()
  })

  it("restaure le filtre « titre affiché » depuis l'URL", () => {
    renderSection(["/?titleEquipped=true"])

    expect(
      screen.getByRole("button", { name: "Or · Histoire" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Fer · Sport" })
    ).not.toBeInTheDocument()
  })

  it("propose d'effacer les filtres quand aucun titre ne correspond", async () => {
    const user = userEvent.setup()
    renderSection(["/?titleQ=inexistant"])

    expect(screen.getByText("Aucun titre")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Effacer les filtres" })
    )

    expect(
      screen.getByRole("button", { name: "Or · Histoire" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Fer · Sport" })
    ).toBeInTheDocument()
  })
})
