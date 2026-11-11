import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshSession, refreshSessionOrEnd } from './session'
import { useSessionStore, type TokenSet } from './session-store'
import { TOKEN_KEY, writeTokens } from './token-storage'

const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload))}.s`
const expiredTokens: TokenSet = { accessToken: jwt({ sub: 'u1' }), refreshToken: 'r1', idToken: null, expiresAt: Date.now() - 1000 }

const ok = () =>
  new Response(JSON.stringify({ access_token: jwt({ user_id: 'u1', roles: ['USER'] }), refresh_token: 'r2', expires_in: 300 }), { status: 200 })

beforeEach(() => {
  localStorage.clear()
  writeTokens(expiredTokens)
  useSessionStore.setState({ status: 'authenticated', tokens: expiredTokens, claims: null, endReason: null })
})
afterEach(() => vi.unstubAllGlobals())

describe('renouvellement de session', () => {
  it('est single-flight : un seul appel au point de jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok())
    vi.stubGlobal('fetch', fetchMock)
    const [a, b] = await Promise.all([refreshSession(), refreshSession()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
    expect(a.status).toBe('ok')
    expect(useSessionStore.getState().claims).toEqual({ userId: 'u1', email: null, roles: ['ROLE_USER'] })
    expect(JSON.parse(localStorage.getItem(TOKEN_KEY)!).refreshToken).toBe('r2')
  })

  it('garde la session sur un échec transitoire', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(refreshSessionOrEnd()).resolves.toBeNull()
    expect(useSessionStore.getState().status).toBe('authenticated')
    expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull()
  })

  it('ferme la session sur un refresh token refusé', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })))
    await expect(refreshSessionOrEnd()).resolves.toBeNull()
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', endReason: 'expired', tokens: null })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
