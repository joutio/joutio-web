// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Page } from "@/shared/types/api"
import type { NotificationView } from "@/shared/types/notifications"
import { queryKeys } from "@/lib/query-keys"
import { notificationsService } from "../lib/notifications"
import {
  useDeleteNotification,
  useMarkNotificationRead,
} from "./useNotifications"

vi.mock("../lib/notifications", () => ({
  notificationsService: {
    remove: vi.fn(),
    list: vi.fn(),
    markRead: vi.fn(),
  },
}))

function notification(
  notificationId: string,
  readAt: string | null
): NotificationView {
  return {
    notificationId,
    type: "FOLLOW",
    actorId: "actor-1",
    sourceId: null,
    topicId: null,
    gameId: null,
    expiresAt: null,
    readAt,
    createdAt: "2026-01-01T10:00:00Z",
  }
}

function page(
  content: NotificationView[],
  totalElements: number
): Page<NotificationView> {
  return {
    content,
    page: 0,
    size: 20,
    totalElements,
    totalPages: 1,
    first: true,
    last: true,
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useMarkNotificationRead", () => {
  it("patche toutes les vues et ne relit pas la projection en retard", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const unreadListKey = queryKeys.notifications.list({
      unreadOnly: true,
      page: 0,
      size: 20,
    })
    const allListKey = queryKeys.notifications.list({
      unreadOnly: false,
      page: 0,
      size: 20,
    })
    queryClient.setQueryData(unreadListKey, page([notification("n1", null)], 1))
    queryClient.setQueryData(
      allListKey,
      page([notification("n1", null), notification("n2", "2026-01-01")], 2)
    )
    queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
      count: 1,
    })
    vi.mocked(notificationsService.markRead).mockResolvedValue(undefined)
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync("n1")
    })

    expect(
      queryClient.getQueryData<Page<NotificationView>>(unreadListKey)?.content
    ).toEqual([])
    const allList = queryClient.getQueryData<Page<NotificationView>>(allListKey)
    expect(
      allList?.content.find((item) => item.notificationId === "n1")?.readAt
    ).not.toBeNull()
    expect(
      queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount()
      )?.count
    ).toBe(0)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it("restaure les vues si le marquage échoue", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const allListKey = queryKeys.notifications.list({
      unreadOnly: false,
      page: 0,
      size: 20,
    })
    queryClient.setQueryData(allListKey, page([notification("n1", null)], 1))
    queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
      count: 1,
    })
    vi.mocked(notificationsService.markRead).mockRejectedValue(
      new Error("boom")
    )

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await expect(result.current.mutateAsync("n1")).rejects.toThrow("boom")
    })

    expect(
      queryClient.getQueryData<Page<NotificationView>>(allListKey)?.content[0]
        ?.readAt
    ).toBeNull()
    expect(
      queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount()
      )?.count
    ).toBe(1)
  })
})

describe("useDeleteNotification", () => {
  it("retire la notification de toutes les vues inbox et décrémente les non-lues", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const unreadListKey = queryKeys.notifications.list({
      unreadOnly: true,
      page: 0,
      size: 20,
    })
    const allListKey = queryKeys.notifications.list({
      unreadOnly: false,
      page: 0,
      size: 20,
    })
    queryClient.setQueryData(unreadListKey, page([notification("n1", null)], 1))
    queryClient.setQueryData(
      allListKey,
      page([notification("n1", null), notification("n2", "2026-01-01")], 2)
    )
    queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
      count: 1,
    })
    vi.mocked(notificationsService.remove).mockResolvedValue(undefined)
    vi.mocked(notificationsService.list).mockResolvedValue(page([], 0))

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync("n1")
    })

    const unreadList =
      queryClient.getQueryData<Page<NotificationView>>(unreadListKey)
    const allList = queryClient.getQueryData<Page<NotificationView>>(allListKey)
    expect(unreadList?.content).toEqual([])
    expect(unreadList?.totalElements).toBe(0)
    expect(allList?.content.map((n) => n.notificationId)).toEqual(["n2"])
    expect(allList?.totalElements).toBe(1)
    expect(
      queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount()
      )?.count
    ).toBe(0)
  })

  it("restaure toutes les vues si la suppression échoue", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const allListKey = queryKeys.notifications.list({
      unreadOnly: false,
      page: 0,
      size: 20,
    })
    const initialList = page([notification("n1", null)], 1)
    queryClient.setQueryData(allListKey, initialList)
    queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
      count: 1,
    })
    vi.mocked(notificationsService.remove).mockRejectedValue(new Error("boom"))

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await expect(result.current.mutateAsync("n1")).rejects.toThrow("boom")
    })

    // Restauration exacte des vues (avant toute réconciliation).
    const restored =
      queryClient.getQueryData<Page<NotificationView>>(allListKey)
    expect(restored?.content.map((n) => n.notificationId)).toEqual(["n1"])
    expect(restored?.totalElements).toBe(1)
    expect(
      queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount()
      )?.count
    ).toBe(1)
  })

  it("réconcilie par convergence : relit l'inbox jusqu'à disparition puis invalide", async () => {
    vi.useFakeTimers()
    try {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const allListKey = queryKeys.notifications.list({
        unreadOnly: false,
        page: 0,
        size: 20,
      })
      queryClient.setQueryData(allListKey, page([notification("n1", null)], 1))
      vi.mocked(notificationsService.remove).mockResolvedValue(undefined)
      // 1ʳᵉ lecture encore périmée (projection en retard), 2ᵉ convergée.
      vi.mocked(notificationsService.list)
        .mockResolvedValueOnce(page([notification("n1", null)], 1))
        .mockResolvedValueOnce(page([], 0))
      const invalidate = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(queryClient),
      })

      act(() => {
        result.current.mutate("n1")
      })
      // Vide la chaîne de microtasks (cancelQueries → patch → mutation → onSettled → 1ʳᵉ lecture).
      await act(async () => {
        for (let tick = 0; tick < 12; tick += 1) await Promise.resolve()
      })

      expect(
        queryClient.getQueryData<Page<NotificationView>>(allListKey)?.content
      ).toEqual([])
      // Aucune invalidation tant que la lecture est périmée (la carte ne doit pas réapparaître).
      expect(invalidate).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(700)
      })
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.all,
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
