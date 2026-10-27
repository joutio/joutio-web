// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { NotificationView } from "@/shared/types/notifications"
import { useRematchRequestStore } from "../stores/useRematchRequestStore"
import { RematchRequestDialog } from "./RematchRequestDialog"

const navigate = vi.fn()
const accept = vi.fn()
const decline = vi.fn()
const markRead = vi.fn()

vi.mock("@/features/shell", () => ({
  useImmersiveNavigate: () => navigate,
}))
vi.mock("@/features/player", () => ({
  usePlayerProfile: () => ({
    data: { pseudonym: "Alex", avatarOptions: null },
  }),
}))
vi.mock("@/features/challenges", () => ({
  useAcceptChallenge: () => ({ accept, pending: false }),
  useDeclineChallenge: () => ({ decline, pending: false }),
}))
vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({ serverNow: () => Date.now(), synced: true }),
}))
vi.mock("../hooks/useNotifications", () => ({
  useMarkNotificationRead: () => ({ mutate: markRead }),
}))

function notification(): NotificationView {
  return {
    notificationId: "n1",
    type: "CHALLENGE_RECEIVED",
    actorId: "u2",
    sourceId: "challenge-1",
    topicId: "topic-1",
    gameId: "game-1",
    expiresAt: new Date(Date.now() + 5_000).toISOString(),
    readAt: null,
    createdAt: new Date().toISOString(),
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  navigate.mockReset()
  accept.mockReset()
  decline.mockReset()
  markRead.mockReset()
  useRematchRequestStore.setState({ requests: [] })
})

describe("RematchRequestDialog", () => {
  it("accepte la revanche, marque la notification lue et ouvre la salle", async () => {
    accept.mockResolvedValue({ status: "accepted", roomId: "room-1" })
    useRematchRequestStore.setState({ requests: [notification()] })
    const user = userEvent.setup()

    render(<RematchRequestDialog />)

    expect(screen.getByText(/Alex veut rejouer/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Accepter" }))

    await waitFor(() => expect(accept).toHaveBeenCalledWith("challenge-1"))
    expect(navigate).toHaveBeenCalledWith("/rooms/room-1")
    expect(useRematchRequestStore.getState().requests).toEqual([])
    expect(markRead).toHaveBeenCalledWith("n1")
  })

  it("ignore une demande déjà expirée et la retire de la file", async () => {
    const expired = notification()
    expired.expiresAt = new Date(Date.now() - 1_000).toISOString()
    useRematchRequestStore.setState({ requests: [expired] })

    render(<RematchRequestDialog />)

    expect(screen.queryByText("Demande de revanche")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(useRematchRequestStore.getState().requests).toEqual([])
    )
    expect(markRead).not.toHaveBeenCalled()
  })

  it("fermer la popup refuse aussi la revanche", async () => {
    decline.mockResolvedValue(undefined)
    useRematchRequestStore.setState({ requests: [notification()] })
    const user = userEvent.setup()

    render(<RematchRequestDialog />)

    await user.click(screen.getByRole("button", { name: "Fermer" }))

    await waitFor(() => expect(decline).toHaveBeenCalledWith("challenge-1"))
    expect(useRematchRequestStore.getState().requests).toEqual([])
    expect(markRead).toHaveBeenCalledWith("n1")
  })

  it("refuse la revanche et ferme la popup", async () => {
    decline.mockResolvedValue(undefined)
    useRematchRequestStore.setState({ requests: [notification()] })
    const user = userEvent.setup()

    render(<RematchRequestDialog />)

    await user.click(screen.getByRole("button", { name: "Refuser" }))

    await waitFor(() => expect(decline).toHaveBeenCalledWith("challenge-1"))
    expect(useRematchRequestStore.getState().requests).toEqual([])
    expect(markRead).toHaveBeenCalledWith("n1")
  })
})
