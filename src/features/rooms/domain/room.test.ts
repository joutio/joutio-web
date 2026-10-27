import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import {
  applyRoomNotification,
  emptyRoom,
  preparationComplete,
  preparationStep,
  PREPARATION_STEPS,
  waitingStatusLabel,
  WIZZ_COOLDOWN_MS,
  wizzState,
} from "./room"

const ROOM_ID = "room-1"
const TOPIC_ID = "topic-1"
const INITIATOR = "initiator-1"
const PARTICIPANT = "participant-1"

/** Traducteur minimal : résout les clés attendues vers leur rendu français. */
const t = ((key: string, options?: { name?: string }) => {
  if (key === "game.room.status.waitingFor") {
    return `En attente de ${options?.name}…`
  }
  const messages: Record<string, string> = {
    "game.room.status.ready": "Tout le monde est prêt…",
    "game.room.status.waitingOpponent": "En attente d'un adversaire…",
  }
  return messages[key] ?? key
}) as TFunction

describe("applyRoomNotification", () => {
  it("crée la salle (sujet, initiateur, échéance)", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: "2026-01-02T00:00:00Z",
    })

    expect(room.status).toBe("WAITING_PLAYERS")
    expect(room.topicId).toBe(TOPIC_ID)
    expect(room.initiatorId).toBe(INITIATOR)
    expect(room.vsBot).toBe(false)
    expect(room.expiresAt).toBe("2026-01-02T00:00:00Z")
  })

  it("marque une salle bot", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: "bot-1",
      vsBot: true,
      expiresAt: null,
    })

    expect(room.vsBot).toBe(true)
    expect(room.opponentId).toBe("bot-1")
  })

  it("marque la présence de l'initiateur sans enregistrer de participant", () => {
    const created = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    })

    const room = applyRoomNotification(created, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    })

    expect(room.initiatorPresent).toBe(true)
    expect(room.participantId).toBeNull()
  })

  it("enregistre le second joueur à son apparition", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    })

    expect(room.participantId).toBe(PARTICIPANT)
    expect(room.participantPresent).toBe(true)
  })

  it("éteint la présence à la sortie sans fermer la salle", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_LEFT",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    })

    expect(room.status).toBe("WAITING_PLAYERS")
    expect(room.participantPresent).toBe(false)
    expect(room.initiatorPresent).toBe(true)
  })

  it("démarre la préparation quand les deux sont présents", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_ALL_PRESENT",
      roomId: ROOM_ID,
    })

    expect(room.status).toBe("FETCHING_PLAYERS")
  })

  it("suit l'avancement de la préparation (profils puis questions)", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_ALL_PRESENT",
      roomId: ROOM_ID,
    })
    room = applyRoomNotification(room, {
      type: "ROOM_PLAYERS_LOADED",
      roomId: ROOM_ID,
    })
    expect(room.status).toBe("FETCHING_PLAYED_QUESTIONS")

    room = applyRoomNotification(room, {
      type: "ROOM_PLAYED_QUESTIONS_LOADED",
      roomId: ROOM_ID,
    })
    expect(room.status).toBe("FETCHING_QUESTIONS")

    room = applyRoomNotification(room, {
      type: "ROOM_QUESTIONS_LOADED",
      roomId: ROOM_ID,
    })
    expect(room.status).toBe("CREATING_GAME")

    room = applyRoomNotification(room, {
      type: "ROOM_GAME_CREATED",
      roomId: ROOM_ID,
      gameId: "game-1",
    })
    expect(room.status).toBe("GAME_CREATED")
    expect(room.gameId).toBe("game-1")
  })

  it("clôt sur partie créée", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_COMPLETED",
      roomId: ROOM_ID,
      gameId: "game-1",
    })

    expect(room.status).toBe("COMPLETED")
    expect(room.gameId).toBe("game-1")
  })

  it("clôt sur annulation", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CANCELLED",
      roomId: ROOM_ID,
      reason: "PLAYER_CANCELLED",
    })

    expect(room.status).toBe("CANCELLED")
  })

  it("clôt sur expiration", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_EXPIRED",
      roomId: ROOM_ID,
    })

    expect(room.status).toBe("EXPIRED")
  })

  it("passe en échec quand la partie n'a pas pu être préparée", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_FAILED",
      roomId: ROOM_ID,
      reason: "TOPIC_NOT_AVAILABLE_IN_LANGUAGE",
    })

    expect(room.status).toBe("FAILED")
  })

  it("mémorise la dernière relance sans toucher à l'état de la salle", () => {
    const created = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: PARTICIPANT,
      vsBot: false,
      expiresAt: null,
    })

    const room = applyRoomNotification(created, {
      type: "ROOM_WIZZED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
      targetId: PARTICIPANT,
      wizzedAt: "2026-01-01T10:00:00Z",
    })

    expect(room.status).toBe("WAITING_PLAYERS")
    expect(room.lastWizz).toEqual({
      playerId: INITIATOR,
      wizzedAt: "2026-01-01T10:00:00Z",
    })
  })
})

describe("wizzState", () => {
  const NOW = Date.parse("2026-01-01T10:00:00Z")

  function nominalWaitingRoom() {
    return {
      ...emptyRoom(ROOM_ID),
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: PARTICIPANT,
      initiatorPresent: true,
    }
  }

  it("autorise la relance quand l'adversaire nommé est absent", () => {
    const state = wizzState(nominalWaitingRoom(), INITIATOR, NOW)

    expect(state.available).toBe(true)
    expect(state.cooldownEndsAt).toBeNull()
  })

  it("autorise la relance symétrique pour l'invité arrivé en premier", () => {
    const room = {
      ...emptyRoom(ROOM_ID),
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: PARTICIPANT,
      participantId: PARTICIPANT,
      participantPresent: true,
    }

    expect(wizzState(room, PARTICIPANT, NOW).available).toBe(true)
  })

  it("refuse sans adversaire nommé (salle partagée) ou contre le bot", () => {
    const shared = { ...nominalWaitingRoom(), opponentId: null }
    expect(wizzState(shared, INITIATOR, NOW).available).toBe(false)

    const bot = { ...nominalWaitingRoom(), vsBot: true }
    expect(wizzState(bot, INITIATOR, NOW).available).toBe(false)
  })

  it("refuse quand l'adversaire est déjà présent ou le viewer absent", () => {
    const bothPresent = {
      ...nominalWaitingRoom(),
      participantId: PARTICIPANT,
      participantPresent: true,
    }
    expect(wizzState(bothPresent, INITIATOR, NOW).available).toBe(false)

    const viewerAbsent = { ...nominalWaitingRoom(), initiatorPresent: false }
    expect(wizzState(viewerAbsent, INITIATOR, NOW).available).toBe(false)
  })

  it("refuse une fois la préparation engagée", () => {
    const room = { ...nominalWaitingRoom(), status: "FETCHING_PLAYERS" as const }

    expect(wizzState(room, INITIATOR, NOW).available).toBe(false)
  })

  it("grise la relance pendant la cadence du joueur émetteur", () => {
    const room = {
      ...nominalWaitingRoom(),
      lastWizz: {
        playerId: INITIATOR,
        wizzedAt: new Date(NOW - 3000).toISOString(),
      },
    }

    const state = wizzState(room, INITIATOR, NOW)
    expect(state.available).toBe(false)
    expect(state.cooldownEndsAt).toBe(NOW - 3000 + WIZZ_COOLDOWN_MS)
  })

  it("libère la relance une fois la cadence écoulée", () => {
    const room = {
      ...nominalWaitingRoom(),
      lastWizz: {
        playerId: INITIATOR,
        wizzedAt: new Date(NOW - WIZZ_COOLDOWN_MS - 1000).toISOString(),
      },
    }

    expect(wizzState(room, INITIATOR, NOW).available).toBe(true)
  })

  it("n'applique pas la cadence de l'autre joueur", () => {
    const room = {
      ...nominalWaitingRoom(),
      lastWizz: { playerId: PARTICIPANT, wizzedAt: new Date(NOW).toISOString() },
    }

    const state = wizzState(room, INITIATOR, NOW)
    expect(state.available).toBe(true)
    expect(state.cooldownEndsAt).toBeNull()
  })
})

describe("preparationStep", () => {
  it("mappe chaque statut sur son étape", () => {
    expect(preparationStep("WAITING_PLAYERS")).toBe(0)
    expect(preparationStep("FETCHING_PLAYERS")).toBe(1)
    expect(preparationStep("FETCHING_PLAYED_QUESTIONS")).toBe(2)
    expect(preparationStep("FETCHING_QUESTIONS")).toBe(2)
    expect(preparationStep("CREATING_GAME")).toBe(3)
    expect(preparationStep("GAME_CREATED")).toBe(3)
  })

  it("marque la préparation terminée quand la partie est créée", () => {
    expect(preparationStep("COMPLETED")).toBe(PREPARATION_STEPS.length)
  })

  it("retombe sur la première étape pour un état terminal sans partie", () => {
    expect(preparationStep("CANCELLED")).toBe(0)
    expect(preparationStep("EXPIRED")).toBe(0)
    expect(preparationStep("FAILED")).toBe(0)
  })
})

describe("preparationComplete", () => {
  it("passe au vert dès la fin de préparation", () => {
    expect(preparationComplete("CREATING_GAME")).toBe(true)
    expect(preparationComplete("GAME_CREATED")).toBe(true)
    expect(preparationComplete("COMPLETED")).toBe(true)
  })

  it("reste en attente pendant la préparation", () => {
    expect(preparationComplete("WAITING_PLAYERS")).toBe(false)
    expect(preparationComplete("FETCHING_PLAYERS")).toBe(false)
    expect(preparationComplete("FETCHING_QUESTIONS")).toBe(false)
    expect(preparationComplete("CANCELLED")).toBe(false)
    expect(preparationComplete("EXPIRED")).toBe(false)
    expect(preparationComplete("FAILED")).toBe(false)
  })
})

describe("waitingStatusLabel", () => {
  it("signale la présence complète", () => {
    expect(
      waitingStatusLabel(
        {
          playerPresent: true,
          opponentPresent: true,
          opponentLabel: "Bob",
        },
        t
      )
    ).toBe("Tout le monde est prêt…")
  })

  it("nomme l'adversaire attendu", () => {
    expect(
      waitingStatusLabel(
        {
          playerPresent: true,
          opponentPresent: false,
          opponentLabel: "Bob",
        },
        t
      )
    ).toBe("En attente de Bob…")
  })

  it("reste générique sans adversaire connu", () => {
    expect(
      waitingStatusLabel(
        {
          playerPresent: true,
          opponentPresent: false,
          opponentLabel: null,
        },
        t
      )
    ).toBe("En attente d'un adversaire…")
  })
})
