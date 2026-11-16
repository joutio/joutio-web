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

  it('ferme la session sur un compte suspendu, avec son échéance et son motif', async () => {
    const { end } = gateway()
    const problem = { type: PROBLEM.accountSuspended, title: 'Suspendu', suspendedUntil: '2026-12-01T00:00:00Z', suspensionReason: 'SPAM' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(403, problem, 'application/problem+json')))
    await expect(api.get('/api/me')).rejects.toBeInstanceOf(ApiRequestError)
    expect(end).toHaveBeenCalledWith('suspended', '2026-12-01T00:00:00Z', 'SPAM')
  })

  it('ferme la session sur un utilisateur inconnu, sans renouveler', async () => {
    const { end, refresh } = gateway()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, { type: PROBLEM.unknownUser })))
    await expect(api.get('/api/me')).rejects.toMatchObject({ type: PROBLEM.unknownUser })
    expect(end).toHaveBeenCalledTimes(1)
    expect((end.mock.calls[0] as unknown[] | undefined)?.[0]).toBe('unknownUser')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('classe une coupure réseau comme transitoire', async () => {
    gateway()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await api.get('/api/me').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).transient).toBe(true)
  })

  it('rapporte la progression d’un envoi FormData, avec le même traitement de réponse', async () => {
    gateway()
    const progress: number[] = []
    class FakeXhr {
      static last: FakeXhr
      upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {}
      status = 0
      statusText = ''
      responseText = ''
      responseType = ''
      withCredentials = false
      headers: Record<string, string> = {}
      onload?: () => void
      onerror?: () => void
      onabort?: () => void
      constructor() {
        FakeXhr.last = this
      }
      open() {}
      setRequestHeader(name: string, value: string) {
        this.headers[name] = value
      }
      getAllResponseHeaders() {
        return 'content-type: application/json\r\n'
      }
      abort() {}
      send() {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
        this.status = 201
        this.responseText = JSON.stringify({ id: 'm1', url: 'https://media/x.png' })
        this.onload?.()
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr)

    const media = await api.post('/api/media', new FormData(), { onUploadProgress: (fraction) => progress.push(fraction) })
    expect(media).toEqual({ id: 'm1', url: 'https://media/x.png' })
    expect(progress).toEqual([0.5, 1])
    expect(FakeXhr.last.headers.Authorization).toBe('Bearer stale')
  })
})
