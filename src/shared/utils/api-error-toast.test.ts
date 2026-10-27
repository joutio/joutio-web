import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import {
  apiErrorToast,
  CHALLENGE_ALREADY_PENDING,
  CHALLENGE_QUOTA_EXCEEDED,
  ROOM_ALREADY_OPEN_ON_TOPIC,
  ROOM_QUOTA_EXCEEDED,
} from "./api-error-toast"

describe("apiErrorToast", () => {
  // Node expose `navigator.language = "en-US"` : on force le français pour les assertions.
  beforeAll(async () => {
    await i18n.changeLanguage("fr")
  })

  it("donne un message dédié quand la salle n'existe plus", () => {
    const toast = apiErrorToast({
      message: "Salon introuvable",
      detail: "Le salon room-1 n'existe pas",
      type: "urn:joutio:room:notFound",
    })

    expect(toast.title).toBe("Ce défi n'est plus disponible")
    expect(toast.description).toContain("expiré")
  })

  it("donne un message dédié quand le défi n'est plus actionnable", () => {
    const toast = apiErrorToast({
      message: "Défi déjà résolu",
      detail: "Le défi challenge-1 est en statut CANCELLED",
      type: "urn:joutio:challenge:notPending",
    })

    expect(toast.title).toBe("Ce défi n'est plus disponible")
    expect(toast.description).toContain("annulé")
  })

  it("explique un défi déjà en attente avec ce joueur sur ce sujet", () => {
    const toast = apiErrorToast({
      message: "Challenge already pending",
      type: CHALLENGE_ALREADY_PENDING,
    })

    expect(toast.title).toBe("Défi déjà en attente")
    expect(toast.description).toContain("ce joueur")
  })

  it("explique la limite de défis en attente", () => {
    const toast = apiErrorToast({
      message: "Challenge quota exceeded",
      type: CHALLENGE_QUOTA_EXCEEDED,
    })

    expect(toast.title).toBe("Limite de défis atteinte")
    expect(toast.description).toContain("limite")
  })

  it("explique un salon déjà ouvert sur le sujet", () => {
    const toast = apiErrorToast({
      message: "Room already open",
      type: ROOM_ALREADY_OPEN_ON_TOPIC,
    })

    expect(toast.title).toBe("Salon déjà ouvert")
    expect(toast.description).toContain("sujet")
  })

  it("explique la limite de salons ouverts", () => {
    const toast = apiErrorToast({
      message: "Room quota exceeded",
      type: ROOM_QUOTA_EXCEEDED,
    })

    expect(toast.title).toBe("Limite de salons atteinte")
    expect(toast.description).toContain("limite")
  })

  it("conserve le message backend pour les autres problèmes", () => {
    const toast = apiErrorToast({
      message: "Bad request",
      detail: "invalid body",
      type: "urn:joutio:social:invalid",
    })

    expect(toast.title).toBe("Bad request")
    expect(toast.description).toBe("invalid body")
  })
})
