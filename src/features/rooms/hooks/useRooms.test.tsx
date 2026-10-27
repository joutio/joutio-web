// @vitest-environment jsdom
import { StrictMode, type ReactNode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/features/shell", () => ({
  useImmersiveNavigate: () => vi.fn(),
}))

vi.mock("@/shared/hooks/useGoBack", () => ({
  useGoBack: () => vi.fn(),
}))

vi.mock("../lib/rooms", () => ({
  roomsService: { join: vi.fn() },
}))

import { roomsService } from "../lib/rooms"
import { useRoomJoin } from "./useRooms"

const joinMock = vi.mocked(roomsService.join)

function strictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>
}

describe("useRoomJoin", () => {
  beforeEach(() => {
    joinMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("réconcilie l'historique après une apparition réussie", async () => {
    joinMock.mockResolvedValue(undefined)
    const onJoined = vi.fn()

    const { result } = renderHook(() => useRoomJoin("room-1", onJoined))

    await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1))
    expect(joinMock).toHaveBeenCalledWith("room-1")
    expect(result.current.failed).toBe(false)
  })

  it("retente un 404 de projection puis réconcilie", async () => {
    joinMock
      .mockRejectedValueOnce({ statusCode: 404, message: "Introuvable" })
      .mockResolvedValue(undefined)
    const onJoined = vi.fn()

    renderHook(() => useRoomJoin("room-1", onJoined))

    await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1), {
      timeout: 3_000,
    })

    expect(joinMock).toHaveBeenCalledTimes(2)
  })

  it("survit au double montage StrictMode (retry non annulé)", async () => {
    joinMock
      .mockRejectedValueOnce({ statusCode: 404, message: "Introuvable" })
      .mockResolvedValue(undefined)
    const onJoined = vi.fn()

    renderHook(() => useRoomJoin("room-1", onJoined), {
      wrapper: strictWrapper,
    })

    await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1))
    expect(joinMock).toHaveBeenCalledTimes(2)
  })

  it("n'insiste pas sur un refus métier et expose l'échec", async () => {
    joinMock.mockRejectedValue({ statusCode: 403, message: "Interdit" })

    const { result } = renderHook(() => useRoomJoin("room-1"))

    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(joinMock).toHaveBeenCalledTimes(1)
  })

  it("relance la boucle via retry après un échec définitif", async () => {
    joinMock
      .mockRejectedValueOnce({ statusCode: 409, message: "Complet" })
      .mockResolvedValue(undefined)
    const onJoined = vi.fn()

    const { result } = renderHook(() => useRoomJoin("room-1", onJoined))
    await waitFor(() => expect(result.current.failed).toBe(true))

    act(() => result.current.retry())

    await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1))
    expect(joinMock).toHaveBeenCalledTimes(2)
  })
})
