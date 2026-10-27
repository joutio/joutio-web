// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import type { Me } from "@/features/shell/domain/me"
import {
  hasCompletedOnboarding,
  isRoomFlowPath,
  isRoomTarget,
  sanitizeReturnTo,
} from "./onboarding"

function me(patch: Partial<Me>): Me {
  return {
    userId: "user-1",
    email: "user@joutio.io",
    pseudonym: "Alpha",
    bio: null,
    country: null,
    avatarOptions: null,
    bannerUrl: null,
    equippedTitle: null,
    language: "fr",
    progression: {
      badges: [],
      rating: 1000,
      peakRating: 1000,
      ratedGames: 0,
      provisional: true,
    },
    stats: {
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winPercent: 0,
      bestScore: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
    },
    followingCount: 0,
    followersCount: 0,
    ...patch,
  } as Me
}

describe("onboarding-target", () => {
  it("ne conserve que les cibles internes", () => {
    expect(sanitizeReturnTo("/join/room-1?x=1")).toBe("/join/room-1?x=1")
    expect(sanitizeReturnTo("https://evil.test/join")).toBeNull()
    expect(sanitizeReturnTo("//evil.test/join")).toBeNull()
    expect(sanitizeReturnTo("javascript:alert(1)")).toBeNull()
    expect(sanitizeReturnTo("/onboarding?returnTo=%2Fprofile")).toBeNull()
  })

  it("reconnaît le parcours room/game prioritaire", () => {
    expect(isRoomFlowPath("/join/room-1")).toBe(true)
    expect(isRoomFlowPath("/rooms/room-1")).toBe(true)
    expect(isRoomFlowPath("/game/game-1/result")).toBe(true)
    expect(isRoomFlowPath("/games")).toBe(false)
    expect(isRoomTarget("/join/room-1")).toBe(true)
    expect(isRoomTarget("/rooms/room-1")).toBe(true)
    expect(isRoomTarget("/profile")).toBe(false)
  })

  it("vaut terminé dès le flag serveur ou une partie humaine jouée", () => {
    expect(hasCompletedOnboarding(me({ onboardingCompleted: true }))).toBe(true)
    expect(
      hasCompletedOnboarding(me({ stats: { ...me({}).stats, played: 1 } }))
    ).toBe(true)
    expect(hasCompletedOnboarding(me({ onboardingCompleted: false }))).toBe(
      false
    )
    expect(hasCompletedOnboarding(undefined)).toBe(false)
  })
})
