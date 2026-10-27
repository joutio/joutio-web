// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NotificationView } from "@/shared/types/notifications"
import { usePendingNotificationToastStore } from "../stores/usePendingNotificationToastStore"
import { useNotificationToast } from "./useNotificationToast"
import { useFlushPendingNotificationToasts } from "./useFlushPendingNotificationToasts"

vi.mock("./useNotificationToast", () => ({
  useNotificationToast: vi.fn(),
}))

const showNotificationToast = vi.fn()

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
  usePendingNotificationToastStore.getState().clear()
  showNotificationToast.mockReset()
  vi.mocked(useNotificationToast).mockReturnValue(showNotificationToast)
})

describe("useFlushPendingNotificationToasts", () => {
  it("garde la file pendant l'immersion puis la rejoue à la sortie", () => {
    const first = notification("n1")
    const second = notification("n2")
    usePendingNotificationToastStore.getState().enqueue(first)
    usePendingNotificationToastStore.getState().enqueue(second)

    const { rerender } = renderHook(
      ({ deferToasts }) => useFlushPendingNotificationToasts(deferToasts),
      { initialProps: { deferToasts: true } }
    )

    expect(showNotificationToast).not.toHaveBeenCalled()

    rerender({ deferToasts: false })

    expect(showNotificationToast.mock.calls).toEqual([[first], [second]])
    expect(usePendingNotificationToastStore.getState().notifications).toEqual(
      []
    )
  })

  it("rejoue immédiatement ce qui était en attente quand l'affichage est autorisé", () => {
    const pending = notification("n1")
    usePendingNotificationToastStore.getState().enqueue(pending)

    renderHook(() => useFlushPendingNotificationToasts(false))

    expect(showNotificationToast).toHaveBeenCalledWith(pending)
  })
})
