import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import { shareMessage } from "./share"

/** Traducteur minimal : résout les clés de partage vers leur rendu français. */
const t = ((key: string, options?: { topic?: string }) => {
  if (key === "game.share.roomMessage") {
    return `Rejoins mon duel Joutio sur « ${options?.topic} » !`
  }
  if (key === "game.share.roomMessageNoTopic") {
    return "Rejoins mon duel Joutio !"
  }
  return key
}) as TFunction

describe("shareMessage", () => {
  it("cite le sujet quand il est connu", () => {
    expect(shareMessage("Cinéma", t)).toContain("« Cinéma »")
    expect(shareMessage(undefined, t)).not.toContain("«")
  })
})
