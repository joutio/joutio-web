import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './api-client'
import { ApiRequestError, PROBLEM } from './api-error'
import { registerSessionGateway } from '../session/session-gateway'

const json = (status: number, body?: unknown, type = 'application/json') =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': type } })

function gateway(overrides: Partial<Parameters<typeof registerSessionGateway>[0]> = {}) {
  const end = vi.fn(() => Promise.resolve())
  const refresh = vi.fn(() => Promise.resolve<string | null>('fresh'))
  registerSessionGateway({ getAccessToken: () => 'stale', refresh, end, subscribe: () => () => {}, ...overrides })
  return { end, refresh }
}

afterEach(() => vi.unstubAllGlobals())

describe('api client', () => {
  it('rejoue une fois après renouvellement sur 401', async () => {
    const { refresh } = gateway()
    const fetchMock = vi.fn().mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.get('/api/me')).resolves.toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const replay = fetchMock.mock.calls[1]![1] as RequestInit
    expect((replay.headers as Record<string, string>).Authorization).toBe('Bearer fresh')
  })

  it('ne rejoue pas sans nouveau jeton', async () => {
    gateway({ refresh: vi.fn(() => Promise.resolve(null)) })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401)))
    await expect(api.get('/api/me')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('ferme la session sur un compte suspendu', async () => {
    const { end } = gateway()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(403, { type: PROBLEM.accountSuspended, title: 'Suspendu' }, 'application/problem+json')))
    await expect(api.get('/api/me')).rejects.toBeInstanceOf(ApiRequestError)
    expect(end).toHaveBeenCalledWith('suspended')
  })

  it('ferme la session sur un utilisateur inconnu, sans renouveler', async () => {
    const { end, refresh } = gateway()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, { type: PROBLEM.unknownUser })))
    await expect(api.get('/api/me')).rejects.toMatchObject({ type: PROBLEM.unknownUser })
    expect(end).toHaveBeenCalledWith('unknownUser')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('classe une coupure réseau comme transitoire', async () => {
    gateway()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await api.get('/api/me').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).transient).toBe(true)
  })
})
