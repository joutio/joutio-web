// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { RewardsCatalog } from "../domain/rewards"

const rewards = vi.hoisted(() => ({ data: null as RewardsCatalog | null, isLoading: false, isError: false, refetch: vi.fn() }))
vi.mock("../hooks/useRewards", () => ({ useRewards: () => rewards }))
vi.mock("@/shared/components/user-avatar", () => ({
  UserAvatar: () => <span data-testid="reward-avatar" />,
}))

import { RewardsSection } from "./RewardsSection"

const locked: RewardsCatalog = {
  rewards: [
    {
      code: "MICAH_AVATAR",
      unlocked: false,
      unlockedAt: null,
      source: null,
      condition: { badgeCode: "ASSIDUITY_BRONZE", badgeLabel: "Régulier", target: 7 },
    },
  ],
}

const unlocked: RewardsCatalog = {
  rewards: [
    {
      code: "MICAH_AVATAR",
      unlocked: true,
      unlockedAt: "2026-10-23T10:00:00Z",
      source: "BADGE",
      condition: { badgeCode: "ASSIDUITY_BRONZE", badgeLabel: "Régulier", target: 7 },
    },
  ],
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("RewardsSection", () => {
  it("affiche la condition d'une récompense verrouillée", () => {
    rewards.data = locked
    render(<MemoryRouter><RewardsSection /></MemoryRouter>)

    expect(screen.getByText("Micah")).toBeInTheDocument()
    expect(screen.getByText("Verrouillée")).toBeInTheDocument()
    expect(screen.getByText(/7 jours d'activité consécutive/)).toBeInTheDocument()
  })

  it("affiche la date et la source d'une récompense débloquée", () => {
    rewards.data = unlocked
    render(<MemoryRouter><RewardsSection /></MemoryRouter>)

    expect(screen.getByText("Débloquée")).toBeInTheDocument()
    expect(screen.getByText(/Débloquée le/)).toBeInTheDocument()
    expect(screen.getByText(/Source : Badge/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ouvrir l'éditeur d'avatar" })).toBeInTheDocument()
  })
})
