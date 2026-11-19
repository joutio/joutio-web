import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendAnswer } from './send-answer'

describe('sendAnswer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resends after a lost request until the server acknowledges', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(undefined)
    const done = sendAnswer({ send, serverNow: () => Date.now(), deadline: Date.now() + 8000 })
    await vi.runAllTimersAsync()
    await expect(done).resolves.toBeUndefined()
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('aborts a hanging attempt after its timeout and sends again', async () => {
    const signals: AbortSignal[] = []
    const send = vi.fn((signal: AbortSignal) => {
      signals.push(signal)
      if (signals.length > 1) return Promise.resolve()
      return new Promise<void>((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    })
    const done = sendAnswer({ send, serverNow: () => Date.now(), deadline: Date.now() + 8000, attemptTimeoutMs: 2500 })
    await vi.advanceTimersByTimeAsync(2500 + 300)
    await expect(done).resolves.toBeUndefined()
    expect(signals[0].aborted).toBe(true)
  })

  it('stops at a business refusal (other round)', async () => {
    const send = vi.fn().mockRejectedValue({ statusCode: 400, type: 'urn:joutio:game:roundMismatch' })
    await expect(sendAnswer({ send, serverNow: () => Date.now(), deadline: Date.now() + 8000 })).rejects.toMatchObject({ statusCode: 400 })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('gives up at the answer deadline', async () => {
    const send = vi.fn().mockRejectedValue(new Error('network'))
    const done = sendAnswer({ send, serverNow: () => Date.now(), deadline: Date.now() + 1000 }).catch((error: unknown) => error)
    await vi.runAllTimersAsync()
    expect(await done).toBeInstanceOf(Error)
    expect(send.mock.calls.length).toBeLessThanOrEqual(4)
  })
})
