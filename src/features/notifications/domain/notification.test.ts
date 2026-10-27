import { describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications"
import {
  isExpired,
  isRematchRequest,
  roomTargetPath,
  notificationTargetPath,
  notificationToast,
  relativeTime,
} from "./notification"

const t = i18n.getFixedT("fr")

function notification(
  type: NotificationType,
  overrides: Partial<NotificationView> = {}
): NotificationView {
  return {
    notificationId: "n1",
    type,
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

function challengeInvitation(expiresAt: string | null): NotificationView {
  return {
    notificationId: "n1",
    type: "CHALLENGE_RECEIVED",
    actorId: "u2",
    sourceId: "challenge-1",
    topicId: "topic-1",
    gameId: null,
    expiresAt,
    readAt: null,
    createdAt: new Date().toISOString(),
  }
}

describe("roomTargetPath", () => {
  const accepted = (
    gameId: string | null,
    sourceId: string | null
  ): NotificationView => ({
    notificationId: "n2",
    type: "ROOM_ACCEPTED",
    actorId: "u2",
    sourceId,
    topicId: "topic-1",
    gameId,
    expiresAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  })

  it("pointe vers l'arène quand la partie est créée", () => {
    expect(roomTargetPath(accepted("game-1", "room-1"))).toBe("/game/game-1")
  })

  it("pointe vers la salle d'attente sinon", () => {
    expect(roomTargetPath(accepted(null, "room-1"))).toBe("/rooms/room-1")
  })

  it("est nul pour les autres types", () => {
    expect(roomTargetPath(challengeInvitation(null))).toBeNull()
  })
})

describe("notificationTargetPath", () => {
  it("pointe vers le profil de l'abonné", () => {
    expect(notificationTargetPath(notification("FOLLOW"))).toBe("/players/u2")
    expect(
      notificationTargetPath(notification("FOLLOW", { actorId: null }))
    ).toBeNull()
  })

  it("pointe vers l'arène ou la salle pour un défi accepté", () => {
    expect(
      notificationTargetPath(
        notification("ROOM_ACCEPTED", { gameId: "game-1" })
      )
    ).toBe("/game/game-1")
    expect(
      notificationTargetPath(
        notification("ROOM_ACCEPTED", { sourceId: "room-1" })
      )
    ).toBe("/rooms/room-1")
  })

  it("pointe vers la carte Défis pour une invitation", () => {
    expect(
      notificationTargetPath(
        notification("CHALLENGE_RECEIVED", { sourceId: "challenge-1" })
      )
    ).toBe("/challenges?type=received&challenge=challenge-1")
  })

  it("pointe vers la page filtrée sans cible pour une invitation expirée", () => {
    expect(
      notificationTargetPath(
        notification("CHALLENGE_RECEIVED", {
          sourceId: "challenge-1",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        })
      )
    ).toBe("/challenges?type=received")
  })

  it("est nul pour les événements purement informatiques", () => {
    expect(
      notificationTargetPath(notification("CHALLENGE_DECLINED"))
    ).toBeNull()
  })

  it("pointe vers la salle pour une relance en attente", () => {
    expect(
      notificationTargetPath(notification("WIZZ", { sourceId: "room-1" }))
    ).toBe("/rooms/room-1")
  })

  it("est nul pour une relance expirée (honorée ou salle close)", () => {
    expect(
      notificationTargetPath(
        notification("WIZZ", {
          sourceId: "room-1",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        })
      )
    ).toBeNull()
    expect(notificationTargetPath(notification("WIZZ"))).toBeNull()
  })
})

describe("notificationToast", () => {
  it("propose l'abonné pour un follow", () => {
    expect(notificationToast(notification("FOLLOW"), t)).toEqual({
      title: "Nouvel abonné",
      description: "Un joueur s'est abonné à toi.",
      path: "/players/u2",
    })
  })

  it("pointe vers l'arène ou la salle pour un défi accepté", () => {
    expect(
      notificationToast(notification("ROOM_ACCEPTED", { gameId: "game-1" }), t)
    ).toEqual({
      title: "Ton défi a été accepté",
      description: "Touche pour rejoindre la salle.",
      path: "/game/game-1",
      tone: "success",
    })
  })

  it("ramène vers l'inbox pour un refus, en ton danger", () => {
    expect(
      notificationToast(notification("CHALLENGE_DECLINED"), t)
    ).toMatchObject({ path: "/notifications", tone: "danger" })
  })

  it("propose la carte Défis pour une invitation", () => {
    expect(
      notificationToast(
        notification("CHALLENGE_RECEIVED", { sourceId: "challenge-1" }),
        t
      )
    ).toEqual({
      title: "Nouveau défi",
      description: "Touche pour voir l'invitation et répondre.",
      path: "/challenges?type=received&challenge=challenge-1",
    })
  })

  it("écarte la revanche du toast : elle passe par la popup dédiée", () => {
    const rematch = notification("CHALLENGE_RECEIVED", {
      sourceId: "challenge-1",
      gameId: "game-1",
    })
    expect(isRematchRequest(rematch)).toBe(true)
    expect(notificationToast(rematch, t)).toBeNull()
  })

  it("garde le toast pour un défi normal", () => {
    expect(
      isRematchRequest(
        notification("CHALLENGE_RECEIVED", { sourceId: "challenge-1" })
      )
    ).toBe(false)
  })

  it("écarte une invitation expirée", () => {
    expect(
      notificationToast(
        notification("CHALLENGE_RECEIVED", {
          sourceId: "challenge-1",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
        t
      )
    ).toBeNull()
  })

  it("écarte une invitation sans source", () => {
    expect(notificationToast(notification("CHALLENGE_RECEIVED"), t)).toBeNull()
  })

  it("propose la salle d'attente pour une relance", () => {
    expect(
      notificationToast(notification("WIZZ", { sourceId: "room-1" }), t)
    ).toEqual({
      title: "On te demande dans la salle !",
      description: "Ton adversaire t'y attend — touche pour le rejoindre.",
      path: "/rooms/room-1",
    })
  })
})

describe("isExpired", () => {
  it("vrai quand la date d'expiration est passée", () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(isExpired(challengeInvitation(past))).toBe(true)
  })

  it("faux quand l'expiration est future ou absente", () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    expect(isExpired(challengeInvitation(future))).toBe(false)
    expect(isExpired(challengeInvitation(null))).toBe(false)
  })
})

describe("relativeTime", () => {
  it("affiche « à l'instant » pour une date récente", () => {
    expect(relativeTime(new Date().toISOString(), t, "fr-FR")).toBe(
      "à l'instant"
    )
  })

  it("affiche les minutes puis les heures", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString()

    expect(relativeTime(fiveMinutesAgo, t, "fr-FR")).toBe("il y a 5 min")
    expect(relativeTime(threeHoursAgo, t, "fr-FR")).toBe("il y a 3 h")
  })

  it("affiche les jours sur une semaine", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString()

    expect(relativeTime(twoDaysAgo, t, "fr-FR")).toBe("il y a 2 j")
  })
})

describe("signalement de question", () => {
  it("pointe vers la fiche du sujet", () => {
    expect(
      notificationTargetPath(
        notification("QUESTION_REPORTED", { topicId: "topic-1" })
      )
    ).toBe("/topics/topic-1")
  })

  it("produit un toast cliquable", () => {
    expect(
      notificationToast(
        notification("QUESTION_REPORTED", { topicId: "topic-1" }),
        t
      )
    ).toEqual({
      title: "Signalement de question",
      description:
        "Un joueur a signalé une question d'un de tes sujets — touche pour ouvrir le sujet.",
      path: "/topics/topic-1",
    })
  })
})
