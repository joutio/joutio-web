import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventStream, type EventEnvelope } from './event-stream'

type Payload = { type: string; n: number }
const envelope = (sequenceNumber: number): EventEnvelope<Payload> => ({
  aggregateId: 'g1',
  sequenceNumber,
  timestamp: new Date(0).toISOString(),
  eventType: 'E',
  payload: { type: 'E', n: sequenceNumber },
})

function setup(history: EventEnvelope<Payload>[]) {
  let push: (body: string) => void = () => {}
  const load = vi.fn(() => Promise.resolve(history))
  const stream = new EventStream<Payload, number[]>({
    initial: () => [],
    apply: (state, payload) => [...state, payload.n],
    load,
    subscribe: (onFrame) => {
      push = onFrame
      return () => {}
    },
  })
  stream.start()
  return { stream, load, push: (seq: number) => push(JSON.stringify(envelope(seq))), raw: (body: string) => push(body) }
}

afterEach(() => vi.useRealTimers())

describe('EventStream', () => {
  it('dédoublonne historique et live par numéro de séquence, et remet le désordre en ordre', async () => {
    const { stream, push } = setup([envelope(0), envelope(1)])
    await vi.waitFor(() => expect(stream.getStatus().loaded).toBe(true))
    push(1)
    push(2)
    push(4)
    expect(stream.getStatus().lagging).toBe(true)
    push(3)
    expect(stream.getSnapshot()).toEqual([0, 1, 2, 3, 4])
    expect(stream.getStatus().lagging).toBe(false)
  })

  it('rejoue l’historique quand un trou persiste', async () => {
    vi.useFakeTimers()
    const { stream, load, push } = setup([envelope(0)])
    await vi.waitFor(() => expect(stream.getStatus().loaded).toBe(true))
    push(2)
    expect(load).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('ignore les trames malformées', async () => {
    const { stream, raw } = setup([envelope(0)])
    await vi.waitFor(() => expect(stream.getStatus().loaded).toBe(true))
    raw('pas du json')
    raw(JSON.stringify({ sequenceNumber: 1 }))
    expect(stream.getSnapshot()).toEqual([0])
  })
})
