import { describe, expect, it } from "vitest"
import type { PlayerCard } from "@/features/player/domain/profile"
import {
  mergePeopleCards,
  parsePeopleDirections,
  sortPeopleCards,
  togglePeopleDirection,
} from "./people-directory"

function person(
  userId: string,
  overrides: Partial<PlayerCard> = {}
): PlayerCard {
  return {
    userId,
    pseudonym: userId,
    avatarOptions: null,
    rating: 200,
    provisional: true,
    following: false,
    presence: null,
    ...overrides,
  }
}

describe("parsePeopleDirections", () => {
  it("lit une direction simple et la liste combinée", () => {
    expect(parsePeopleDirections("following")).toEqual(["following"])
    expect(parsePeopleDirections("following,followers")).toEqual([
      "following",
      "followers",
    ])
  })

  it("ignore les valeurs invalides et retombe sur Abonnements", () => {
    expect(parsePeopleDirections("")).toEqual(["following"])
    expect(parsePeopleDirections("foo,bar")).toEqual(["following"])
    expect(parsePeopleDirections("followers,foo")).toEqual(["followers"])
  })
})

describe("togglePeopleDirection", () => {
  it("ajoute la seconde direction sans retirer la première", () => {
    expect(togglePeopleDirection(["following"], "followers")).toEqual([
      "following",
      "followers",
    ])
  })

  it("retire une direction quand l'autre reste sélectionnée", () => {
    expect(
      togglePeopleDirection(["following", "followers"], "followers")
    ).toEqual(["following"])
  })

  it("conserve toujours au moins une direction", () => {
    expect(togglePeopleDirection(["following"], "following")).toEqual([
      "following",
    ])
  })
})

describe("lists fusionnées", () => {
  it("déduplique les joueurs mutuels en conservant l'ordre des listes", () => {
    expect(
      mergePeopleCards([
        [person("u1"), person("u2")],
        [person("u2"), person("u3")],
      ]).map((card) => card.userId)
    ).toEqual(["u1", "u2", "u3"])
  })

  it("trie par Elo puis pseudonyme", () => {
    expect(
      sortPeopleCards(
        [
          person("zoe", { rating: 800 }),
          person("alice", { rating: 200 }),
          person("bob", { rating: 800 }),
        ],
        "ELO"
      ).map((card) => card.userId)
    ).toEqual(["bob", "zoe", "alice"])
  })

  it("trie par ordre alphabétique", () => {
    expect(
      sortPeopleCards(
        [person("zoe"), person("alice"), person("bob")],
        "ALPHA"
      ).map((card) => card.userId)
    ).toEqual(["alice", "bob", "zoe"])
  })

  it("conserve l'ordre fourni pour RECENT", () => {
    expect(
      sortPeopleCards([person("zoe"), person("alice")], "RECENT").map(
        (card) => card.userId
      )
    ).toEqual(["zoe", "alice"])
  })
})
