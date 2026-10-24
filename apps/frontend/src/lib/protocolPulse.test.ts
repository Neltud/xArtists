import { describe, expect, it } from 'vitest'
import { egldFromAtomic, upbitPosture } from './protocolPulse'

describe('upbitPosture', () => {
  it('is before the decision window on 18 oct', () => {
    expect(upbitPosture(Date.parse('2026-10-18T22:00:00Z')).phase).toBe('before')
  })

  it('is inside the window on 20 oct (day 2) and 21 oct (day 3)', () => {
    const d2 = upbitPosture(Date.parse('2026-10-20T04:40:00Z'))
    expect(d2.phase).toBe('window')
    expect(d2.day).toBe(2)
    expect(d2.label).toMatch(/paper/)
    const d3 = upbitPosture(Date.parse('2026-10-21T04:30:00Z'))
    expect(d3.day).toBe(3)
    expect(d3.label).toMatch(/Bithumb/)
    expect(d3.label).toMatch(/SOPH/)
  })

  it('is still the original window just before the Upbit extension post', () => {
    const row = upbitPosture(Date.parse('2026-10-23T05:00:00Z'))
    expect(row.phase).toBe('window')
    expect(row.day).toBe(5)
  })

  it('is the official extension on 24 oct — not a clearance', () => {
    const morning = upbitPosture(Date.parse('2026-10-24T04:40:00Z'))
    expect(morning.phase).toBe('extended')
    expect(morning.day).toBe(1)
    const row = upbitPosture(Date.parse('2026-10-24T08:00:00Z'))
    expect(row.phase).toBe('extended')
    expect(row.day).toBe(2)
    expect(row.label).toMatch(/Prolongation/)
    expect(row.label).toMatch(/207379109/)
    expect(row.label).toMatch(/VITE_LIA_LIVE_TRADING/)
    expect(row.label).toMatch(/Pas de swap/)
  })

  it('stays paper after 20 nov until an explicit maintain notice', () => {
    const row = upbitPosture(Date.parse('2026-11-21T00:00:00Z'))
    expect(row.phase).toBe('after')
    expect(row.label).toMatch(/paper/)
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
