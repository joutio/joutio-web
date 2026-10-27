import { beforeEach, describe, expect, it } from "vitest"
import type { User } from "oidc-client-ts"
import {
  getAccessToken,
  getRefreshToken,
  getSessionDisplayName,
  getSessionUserId,
  selectAuthenticated,
  selectDisplayName,
  selectStatus,
  selectUserId,
  useSessionStore,
} from "./useSessionStore"

function fakeUser(): User {
  return {
    access_token: "access-1",
    refresh_token: "refresh-1",
    profile: {
      user_id: "user-1",
      sub: "sub-1",
      email: "joueur@joutio.test",
      preferred_username: "Joueur",
    },
  } as unknown as User
}

beforeEach(() => {
  useSessionStore.setState({ status: "loading", user: null })
})

describe("useSessionStore", () => {
  it("démarre en statut loading", () => {
    expect(useSessionStore.getState().status).toBe("loading")
    expect(selectAuthenticated(useSessionStore.getState())).toBe(false)
  })

  it("passe à authenticated au chargement d'un user et expose ses dérivés", () => {
    useSessionStore.getState().setUser(fakeUser())
    const state = useSessionStore.getState()

    expect(state.status).toBe("authenticated")
    expect(selectAuthenticated(state)).toBe(true)
    expect(selectUserId(state)).toBe("user-1")
    expect(selectDisplayName(state)).toBe("Joueur")
    expect(getSessionUserId()).toBe("user-1")
    expect(getSessionDisplayName()).toBe("Joueur")
    expect(getAccessToken()).toBe("access-1")
    expect(getRefreshToken()).toBe("refresh-1")
  })

  it("retombe en anonymous et purge les tokens sur setUser(null)", () => {
    useSessionStore.getState().setUser(fakeUser())
    useSessionStore.getState().setUser(null)

    expect(selectStatus(useSessionStore.getState())).toBe("anonymous")
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it("replie user_id sur sub quand absent", () => {
    useSessionStore.getState().setUser({
      access_token: "a",
      profile: { sub: "sub-only" },
    } as unknown as User)

    expect(selectUserId(useSessionStore.getState())).toBe("sub-only")
  })
})
