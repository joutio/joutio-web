// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SocialPending } from "./useSocialPending"
import type { PendingDuel, ReceivedDuel } from "../domain/pending-duel"
import { useTopicDuelState } from "./useTopicDuelState"

const state = vi.hoisted(() => ({
  current: null as SocialPending | null,
}))

vi.mock("./useSocialPending", () => ({
  useSocialPending: () => state.current,
}))

function topic(topicId: string) {
  return {
    topicId,
    names: { fr: "Histoire" },
    category: null,
    emoji: null,
    color: null,
    imageUrl: null,
    titles: null,
  }
}

function received(
  id: string,
  topicId: string,
  playerId: string
): ReceivedDuel {
  return {
    kind: "received",
    id,
    topic: topic(topicId),
    player: { userId: playerId, pseudonym: playerId, avatarOptions: null },
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    rematch: false,
  }
}

function sent(
  id: string,
  topicId: string,
  playerId: string
): Extract<PendingDuel, { kind: "sent" }> {
  return {
    kind: "sent",
    id,
    topic: topic(topicId),
    player: { userId: playerId, pseudonym: playerId, avatarOptions: null },
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    rematch: false,
  }
}

function room(
  topicId: string,
  canCancel: boolean
): Extract<PendingDuel, { kind: "room" }> {
  return {
    kind: "room",
    id: `room-${topicId}-${canCancel}`,
    topic: topic(topicId),
    player: null,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    canCancel,
  }
}

function pending(overrides: Partial<SocialPending> = {}): SocialPending {
  return {
    received: [],
    sent: [],
    rooms: [],
    total: 0,
    isLoading: false,
    ...overrides,
  }
}

beforeEach(() => {
  state.current = pending()
})

describe("useTopicDuelState", () => {
  it("bloque les adversaires déjà en défi sur le sujet, dans les deux sens", () => {
    state.current = pending({
      received: [received("c1", "topic-1", "u2")],
      sent: [sent("c2", "topic-1", "u3")],
    })

    const { result } = renderHook(() => useTopicDuelState("topic-1"))

    expect([...result.current.blockedOpponentIds]).toEqual(["u2", "u3"])
    expect(result.current.challengeInProgressOnTopic).toBe(true)
  })

  it("ignore les défis d'un autre sujet", () => {
    state.current = pending({
      sent: [sent("c1", "topic-2", "u2")],
    })

    const { result } = renderHook(() => useTopicDuelState("topic-1"))

    expect(result.current.blockedOpponentIds.size).toBe(0)
    expect(result.current.challengeInProgressOnTopic).toBe(false)
  })

  it("bloque un second salon seulement si le joueur en est l'initiateur", () => {
    state.current = pending({
      rooms: [room("topic-1", true), room("topic-2", true)],
    })

    const { result } = renderHook(() => useTopicDuelState("topic-1"))

    expect(result.current.roomAlreadyOpenOnTopic).toBe(true)
  })

  it("ne bloque pas un salon où le joueur n'est qu'invité", () => {
    state.current = pending({
      rooms: [room("topic-1", false)],
    })

    const { result } = renderHook(() => useTopicDuelState("topic-1"))

    expect(result.current.roomAlreadyOpenOnTopic).toBe(false)
  })
})
