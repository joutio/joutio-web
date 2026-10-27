// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NotificationView } from "@/shared/types/notifications"

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  markRead: vi.fn(),
  showToast: vi.fn(),
  isSentRematch: vi.fn(),
}))

vi.mock("@/features/shell", () => ({
  useImmersiveNavigate: () => mocks.navigate,
}))
vi.mock("@/features/challenges", () => ({
  isSentRematch: (challengeId: string | null) =>
    mocks.isSentRematch(challengeId),
}))
vi.mock("./useNotifications", () => ({
  useMarkNotificationRead: () => ({ mutate: mocks.markRead }),
}))
vi.mock("@/shared/utils/toast", () => ({ showToast: mocks.showToast }))

import { useNotificationToast } from "./useNotificationToast"

function notification(
  overrides: Partial<NotificationView> = {}
): NotificationView {
  return {
    notificationId: "n1",
    type: "FOLLOW",
    actorId: "u2",
    sourceId: null,
    topicId: null,
    gameId: null,
    expiresAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("useNotificationToast", () => {
  beforeEach(() => {
    mocks.navigate.mockClear()
    mocks.markRead.mockClear()
    mocks.showToast.mockClear()
    mocks.isSentRematch.mockReset()
    mocks.isSentRematch.mockReturnValue(false)
  })

  it("le clic vaut lecture puis navigation", () => {
    const { result } = renderHook(() => useNotificationToast())
    result.current(notification())

    const options = mocks.showToast.mock.calls[0]?.[0] as {
      onClick: () => void
    }
    options.onClick()

    expect(mocks.markRead).toHaveBeenCalledWith("n1")
    expect(mocks.navigate).toHaveBeenCalledWith("/players/u2")
  })

  it("supprime le doublon d'issue d'une revanche envoyée et marque lu", () => {
    mocks.isSentRematch.mockReturnValue(true)
    const { result } = renderHook(() => useNotificationToast())
    result.current(
      notification({ type: "CHALLENGE_DECLINED", sourceId: "challenge-1" })
    )

    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(mocks.markRead).toHaveBeenCalledWith("n1")
  })
})
