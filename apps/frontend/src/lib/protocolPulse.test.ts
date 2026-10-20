import { describe, expect, it } from 'vitest'
import { egldFromAtomic, upbitPosture } from './protocolPulse'

describe('upbitPosture', () => {
  it('is before the decision window on 18 oct', () => {
    expect(upbitPosture(Date.parse('2026-10-18T22:00:00Z')).phase).toBe('before')
  })

  it('is inside the window on 20 oct', () => {
    const row = upbitPosture(Date.parse('2026-10-20T04:40:00Z'))
    expect(row.phase).toBe('window')
    expect(row.label).toMatch(/paper/)
  })

  it('is after the window on 24 oct', () => {
    expect(upbitPosture(Date.parse('2026-10-24T00:00:00Z')).phase).toBe('after')
  })
})

describe('egldFromAtomic', () => {
  it('converts 18 decimals', () => {
    expect(egldFromAtomic('1585598000000000000')).toBeCloseTo(1.585598, 6)
  })

  it('rejects junk', () => {
    expect(egldFromAtomic('nope')).toBe(0)
  })
})
