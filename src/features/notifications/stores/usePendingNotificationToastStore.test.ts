import { beforeEach, describe, expect, it } from "vitest"
import type { NotificationView } from "@/shared/types/notifications"
import { usePendingNotificationToastStore } from "./usePendingNotificationToastStore"

const store = usePendingNotificationToastStore

function notification(notificationId: string): NotificationView {
  return {
    notificationId,
    type: "CHALLENGE_RECEIVED",
    actorId: "u2",
    sourceId: `challenge-${notificationId}`,
    topicId: "topic-1",
    gameId: null,
    expiresAt: null,
    readAt: null,
    createdAt: "2026-01-01T10:00:00Z",
  }
}

beforeEach(() => {
  store.getState().clear()
})

describe("usePendingNotificationToastStore", () => {
  it("met en file dans l'ordre d'arrivée en dédoublonnant par notificationId", () => {
    const first = notification("n1")
    const second = notification("n2")

    store.getState().enqueue(first)
    store.getState().enqueue(second)
    store.getState().enqueue(first)

    expect(store.getState().notifications).toEqual([first, second])
  })

  it("draine la file une seule fois, dans l'ordre", () => {
    const first = notification("n1")
    const second = notification("n2")
    store.getState().enqueue(first)
    store.getState().enqueue(second)

    expect(store.getState().drain()).toEqual([first, second])
    expect(store.getState().notifications).toEqual([])
    expect(store.getState().drain()).toEqual([])
  })

  it("retire une notification supprimée avant le rejeu", () => {
    store.getState().enqueue(notification("n1"))
    store.getState().enqueue(notification("n2"))

    store.getState().remove("n1")

    expect(store.getState().drain()).toEqual([notification("n2")])
  })
})
