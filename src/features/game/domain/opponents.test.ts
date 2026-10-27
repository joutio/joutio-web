import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import type { PlayerCard } from "@/features/player/domain/profile"
import type { Suggestion } from "@/features/shell/domain/suggestion"
import { playerCardsToSuggestions, playerSuggestions } from "./opponents"

/** Traducteur minimal : résout la clé Elo vers son rendu français. */
const t = ((key: string, options?: { rating?: number }) => {
  if (key === "game.common.elo") return `Elo ${options?.rating}`
  return key
}) as TFunction

const topic: Suggestion = {
  type: "TOPIC",
  id: "topic-1",
  label: "Star Wars",
  subtitle: "Cinéma",
  category: "MOVIES",
  emoji: "🚀",
  color: null,
  imageUrl: null,
  avatarOptions: null,
  names: { fr: "Star Wars" },
}

const player = (id: string, label: string | null = "Joueur"): Suggestion => ({
  type: "PLAYER",
  id,
  label,
  subtitle: "Elo 1200",
  category: null,
  emoji: null,
  color: null,
  imageUrl: null,
  avatarOptions: null,
  names: null,
})

describe("playerSuggestions", () => {
  it("garde les joueurs, écarte les sujets et soi-même", () => {
    const result = playerSuggestions(
      [topic, player("me"), player("opponent-1")],
      "me"
    )

    expect(result.map((s) => s.id)).toEqual(["opponent-1"])
  })

  it("écarte les joueurs sans libellé", () => {
    const result = playerSuggestions([player("opponent-1", null)], "me")

    expect(result).toEqual([])
  })
})

const card = (overrides: Partial<PlayerCard> = {}): PlayerCard => ({
  userId: "opponent-1",
  pseudonym: "Joueur",
  avatarOptions: null,
  rating: 1200,
  provisional: true,
  following: true,
  presence: null,
  ...overrides,
})

describe("playerCardsToSuggestions", () => {
  it("convertit les cartes, écarte soi-même et les pseudonymes absents", () => {
    const result = playerCardsToSuggestions(
      [
        card({ userId: "me" }),
        card({ userId: "no-name", pseudonym: null }),
        card({ userId: "opponent-1", pseudonym: "Ada" }),
      ],
      "me",
      t
    )

    expect(result).toEqual([
      {
        type: "PLAYER",
        id: "opponent-1",
        label: "Ada",
        subtitle: "Elo 1200",
        category: null,
        emoji: null,
        color: null,
        imageUrl: null,
        avatarOptions: null,
        names: null,
      },
    ])
  })

  it("replie le sous-titre sur l'Elo sans titre", () => {
    const result = playerCardsToSuggestions(
      [card({ userId: "opponent-1", rating: 1200 })],
      "me",
      t
    )

    expect(result[0].subtitle).toBe("Elo 1200")
  })
})
