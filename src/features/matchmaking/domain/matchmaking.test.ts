import { describe, expect, it } from "vitest"
import { applyMatchmakingNotification, emptyMatchmaking } from "./matchmaking"

describe("applyMatchmakingNotification", () => {
  it("SEARCHING porte le sujet et l'échéance de la fenêtre (compte à rebours)", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "SEARCHING",
      ticketId: "ticket-1",
      topicId: "topic-1",
      deadlineAt: "2026-01-01T10:00:10Z",
    })

    expect(ticket.status).toBe("SEARCHING")
    expect(ticket.topicId).toBe("topic-1")
    expect(ticket.deadlineAt).toBe("2026-01-01T10:00:10Z")
  })

  it("MATCHED expose la salle côté client (statut serveur COMPLETED)", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "MATCHED",
      ticketId: "ticket-1",
      roomId: "room-1",
      opponentId: "opponent-1",
      vsBot: false,
    })

    expect(ticket.status).toBe("MATCHED")
    expect(ticket.roomId).toBe("room-1")
    expect(ticket.opponentId).toBe("opponent-1")
  })

  it("CANCELLED reste un état client terminal", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "CANCELLED",
      ticketId: "ticket-1",
    })

    expect(ticket.status).toBe("CANCELLED")
  })

  it("EXPIRED reste un état client terminal (relance ou entraînement)", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "EXPIRED",
      ticketId: "ticket-1",
    })

    expect(ticket.status).toBe("EXPIRED")
    expect(ticket.roomId).toBeNull()
  })
})
