import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { EventEnvelopeResponse } from "@/shared/types/notifications"
import { NotificationStream } from "./notification-stream"

const wsMock = vi.hoisted(() => ({
  handler: undefined as ((message: { body: string }) => void) | undefined,
  onConnect: undefined as (() => void) | undefined,
}))

vi.mock("@/lib/ws", () => ({
  subscribeStomp: (
    _service: string,
    _destination: string,
    handler: (message: { body: string }) => void,
    onConnect?: () => void
  ) => {
    wsMock.handler = handler
    wsMock.onConnect = onConnect
    return () => {}
  },
}))

interface Payload {
  type: string
}

interface State {
  applied: string[]
}

function envelope<T extends { type: string }>(
  sequenceNumber: number,
  payload: T
): EventEnvelopeResponse<T> {
  return {
    aggregateId: "g1",
    sequenceNumber,
    timestamp: "2026-09-18T10:00:00Z",
    eventType: payload.type,
    payload,
  }
}

function buildStream(
  load: () => Promise<EventEnvelopeResponse<Payload>[]>,
  apply: (state: State, payload: Payload) => State = (state, payload) => ({
    applied: [...state.applied, payload.type],
  }),
  onLive?: (
    envelope: EventEnvelopeResponse<Payload>,
    receivedAt: number
  ) => void,
  options?: { notFoundGraceMs?: number; notFoundRetryDelayMs?: number }
) {
  return new NotificationStream<Payload, State>({
    service: "game",
    aggregateId: "g1",
    topic: "/topic/games/g1",
    initial: () => ({ applied: [] }),
    load,
    apply,
    onLive,
    ...options,
  })
}

describe("NotificationStream", () => {
  beforeEach(() => {
    wsMock.handler = undefined
    wsMock.onConnect = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("charge l'historique REST puis l'applique dans l'ordre", async () => {
    const stream = buildStream(async () => [
      envelope(1, { type: "A" }),
      envelope(2, { type: "B" }),
    ])

    stream.start()

    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B"] })
  })

  it("déduplique par sequenceNumber (REST + WS)", async () => {
    const stream = buildStream(async () => [
      envelope(1, { type: "A" }),
      envelope(2, { type: "B" }),
    ])
    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    // Rejoue la séquence 2 (déjà appliquée) puis une nouvelle séquence 3.
    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "B" })) })
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B"] })

    wsMock.handler?.({ body: JSON.stringify(envelope(3, { type: "C" })) })
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B", "C"] })
  })

  it("ignore les enveloppes malformées (JSON invalide, contrat incomplet)", async () => {
    const stream = buildStream(async () => [envelope(1, { type: "A" })])
    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    wsMock.handler?.({ body: "{not-json" })
    wsMock.handler?.({ body: JSON.stringify({ foo: "bar" }) })
    wsMock.handler?.({
      body: JSON.stringify({ ...envelope(2, { type: "B" }), payload: null }),
    })

    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })
  })

  it("ne corrompt jamais l'état si le fold renvoie undefined (type inconnu)", async () => {
    const stream = buildStream(
      async () => [envelope(1, { type: "A" })],
      () => undefined as unknown as State
    )
    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "UNKNOWN" })) })

    expect(stream.getSnapshot()).toEqual({ applied: [] })
  })

  it("rejoue l'historique à la (re)connexion WS", async () => {
    let calls = 0
    const stream = buildStream(async () => {
      calls += 1
      return [envelope(1, { type: calls === 1 ? "A" : "A2" })]
    })
    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })

    wsMock.onConnect?.()

    await vi.waitFor(() =>
      expect(stream.getSnapshot()).toEqual({ applied: ["A2"] })
    )
  })

  it("retente un chargement transitoire avec backoff puis charge l'historique", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(async () => {
      calls += 1
      if (calls === 1) throw { statusCode: 408, message: "Délai dépassé" }
      return [envelope(1, { type: "A" })]
    })

    stream.start()

    await vi.waitFor(() => expect(stream.isRetrying()).toBe(true))
    await vi.advanceTimersByTimeAsync(1_000)
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    expect(calls).toBe(2)
    expect(stream.isRetrying()).toBe(false)
    expect(stream.hasLoadError()).toBe(false)
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })
  })

  it("marque une erreur terminale (404) et ne retente pas", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(async () => {
      calls += 1
      throw { statusCode: 404, message: "Introuvable" }
    })

    stream.start()

    await vi.waitFor(() => expect(stream.hasLoadError()).toBe(true))
    await vi.advanceTimersByTimeAsync(10_000)

    expect(calls).toBe(1)
    expect(stream.isRetrying()).toBe(false)
  })

  it("tolère un 404 initial le temps que la projection rattrape", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(
      async () => {
        calls += 1
        if (calls === 1) throw { statusCode: 404, message: "Introuvable" }
        return [envelope(1, { type: "A" })]
      },
      undefined,
      undefined,
      { notFoundGraceMs: 1_000, notFoundRetryDelayMs: 10 }
    )

    stream.start()
    await vi.waitFor(() => expect(calls).toBe(1))
    // Le 404 initial ne doit pas signaler une « reconnexion ».
    expect(stream.isRetrying()).toBe(false)

    await vi.advanceTimersByTimeAsync(10)
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    expect(calls).toBe(2)
    expect(stream.hasLoadError()).toBe(false)
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })
  })

  it("redevient terminal quand le 404 dépasse la fenêtre de grâce", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(
      async () => {
        calls += 1
        throw { statusCode: 404, message: "Introuvable" }
      },
      undefined,
      undefined,
      { notFoundGraceMs: 50, notFoundRetryDelayMs: 10 }
    )

    stream.start()
    await vi.advanceTimersByTimeAsync(100)
    await vi.waitFor(() => expect(stream.hasLoadError()).toBe(true))

    expect(calls).toBeGreaterThan(1)
    expect(stream.isRetrying()).toBe(false)
  })

  it("ne tolère pas un 404 survenu après un chargement réussi", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(
      async () => {
        calls += 1
        if (calls === 1) return [envelope(1, { type: "A" })]
        throw { statusCode: 404, message: "Introuvable" }
      },
      undefined,
      undefined,
      { notFoundGraceMs: 1_000, notFoundRetryDelayMs: 10 }
    )

    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    wsMock.onConnect?.()
    await vi.waitFor(() => expect(stream.hasLoadError()).toBe(true))

    expect(calls).toBe(2)
  })

  it("garde un 403 terminal malgré la fenêtre de grâce", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(
      async () => {
        calls += 1
        throw { statusCode: 403, message: "Interdit" }
      },
      undefined,
      undefined,
      { notFoundGraceMs: 1_000, notFoundRetryDelayMs: 10 }
    )

    stream.start()
    await vi.waitFor(() => expect(stream.hasLoadError()).toBe(true))
    await vi.advanceTimersByTimeAsync(1_000)

    expect(calls).toBe(1)
  })

  it("annule le retry planifié au stop", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(async () => {
      calls += 1
      throw new Error("réseau")
    })

    stream.start()

    await vi.waitFor(() => expect(stream.isRetrying()).toBe(true))
    stream.stop()
    expect(stream.isRetrying()).toBe(false)

    await vi.advanceTimersByTimeAsync(10_000)

    expect(calls).toBe(1)
  })
})

describe("NotificationStream — ordre et trous de séquence", () => {
  beforeEach(() => {
    wsMock.handler = undefined
    wsMock.onConnect = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("bufferise une trame arrivée dans le désordre et la rejoue dans l'ordre", async () => {
    const stream = buildStream(async () => [envelope(1, { type: "A" })])
    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    // La séquence 3 arrive avant la 2 : rien n'est appliqué hors ordre.
    wsMock.handler?.({ body: JSON.stringify(envelope(3, { type: "C" })) })
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })
    expect(stream.isLagging()).toBe(true)

    // La 2 arrive : les deux sont appliquées dans l'ordre.
    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "B" })) })
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B", "C"] })
    expect(stream.isLagging()).toBe(false)
  })

  it("rejoue l'historique REST quand une trame reste manquante", async () => {
    vi.useFakeTimers()
    let calls = 0
    const stream = buildStream(async () => {
      calls += 1
      return calls === 1
        ? [envelope(1, { type: "A" })]
        : [
            envelope(1, { type: "A" }),
            envelope(2, { type: "B" }),
            envelope(3, { type: "C" }),
          ]
    })

    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))

    // La 4 arrive seule : trou détecté, rechargement différé.
    wsMock.handler?.({ body: JSON.stringify(envelope(4, { type: "D" })) })
    expect(stream.isLagging()).toBe(true)

    await vi.advanceTimersByTimeAsync(400)
    await vi.waitFor(() =>
      expect(stream.getSnapshot()).toEqual({ applied: ["A", "B", "C", "D"] })
    )
    expect(calls).toBe(2)
    expect(stream.isLagging()).toBe(false)
  })

  it("n'abandonne pas un rechargement demandé pendant un chargement en vol", async () => {
    let calls = 0
    let resolveLoad:
      ((value: EventEnvelopeResponse<Payload>[]) => void) | undefined
    const stream = buildStream(
      () =>
        new Promise((resolve) => {
          calls += 1
          resolveLoad = resolve
        })
    )

    stream.start()
    await vi.waitFor(() => expect(calls).toBe(1))

    // Reconnexion pendant le premier chargement : le rechargement est mis en file.
    wsMock.onConnect?.()
    expect(calls).toBe(1)

    resolveLoad?.([envelope(1, { type: "A" })])
    await vi.waitFor(() => expect(calls).toBe(2))

    resolveLoad?.([envelope(1, { type: "A" })])
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] })
  })

  it("échantillonne l'horloge uniquement sur les trames WS", async () => {
    const onLive = vi.fn()
    const stream = buildStream(
      async () => [envelope(1, { type: "A" })],
      (state, payload) => ({ applied: [...state.applied, payload.type] }),
      onLive
    )

    stream.start()
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true))
    expect(onLive).not.toHaveBeenCalled()

    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "B" })) })
    expect(onLive).toHaveBeenCalledTimes(1)
    expect(typeof onLive.mock.calls[0]?.[1]).toBe("number")
  })
})
