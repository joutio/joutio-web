import { SWOOSH_DURATION_MS, VS_DURATION_MS, type ArenaScene } from '@joutio/client/game'
import { describe, expect, it } from 'vitest'
import { versusElapsedMs } from './versus'

describe('versusElapsedMs', () => {
  it('grows without restarting across the vs and swoosh windows', () => {
    const samples: number[] = []
    for (let t = 0; t < VS_DURATION_MS + SWOOSH_DURATION_MS; t += 50) {
      const scene = (t < VS_DURATION_MS ? { kind: 'vs', elapsedMs: t } : { kind: 'swoosh', elapsedMs: t - VS_DURATION_MS }) as ArenaScene
      samples.push(versusElapsedMs(scene))
    }
    expect(samples).toEqual([...samples].sort((a, b) => a - b))
    expect(samples.at(-1)).toBeGreaterThan(VS_DURATION_MS)
  })
})
