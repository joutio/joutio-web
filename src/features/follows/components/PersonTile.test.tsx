// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerCard } from "@/features/player/domain/profile"
import { PersonTile } from "./PersonTile"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

const PERSON: PlayerCard = {
  userId: "u1",
  pseudonym: "Alice",
  avatarOptions: null,
  rating: 200,
  provisional: true,
  following: true,
  presence: { userId: "u1", status: "ONLINE", lastSeenAt: null },
  suspended: true,
}

describe("PersonTile", () => {
  it("transmet l'état suspendu au voyant de présence", () => {
    const { container } = render(
      <PersonTile person={PERSON} onOpen={vi.fn()} />
    )

    expect(container.querySelector('[role="img"]')).toHaveClass(
      "bg-[var(--duel-gauge)]"
    )
  })
})
