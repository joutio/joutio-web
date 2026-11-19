import { describe, expect, it } from 'vitest'
import { CLOCK_BACKSTEP_TOLERANCE_MS, nextClockOffset } from './server-clock'

describe('nextClockOffset', () => {
  it('takes the first sample', () => {
    expect(nextClockOffset(null, -120)).toBe(-120)
  })

  it('keeps the largest offset when a delayed frame would move the clock back', () => {
    expect(nextClockOffset(500, 500 - 250)).toBe(500)
  })

  it('moves forward on a fresher sample', () => {
    expect(nextClockOffset(500, 620)).toBe(620)
  })

  it('applies a real backward shift (device clock changed)', () => {
    expect(nextClockOffset(500, 500 - CLOCK_BACKSTEP_TOLERANCE_MS)).toBe(500 - CLOCK_BACKSTEP_TOLERANCE_MS)
  })
})
