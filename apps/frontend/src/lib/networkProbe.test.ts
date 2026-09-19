import { describe, expect, it } from 'vitest'
import { atomicToEgld, isCodeEmpty, liaOpsFunded, supernovaAgeEpochs } from './networkProbe'

describe('atomicToEgld', () => {
  it('parses LIA Ops 19 sept 2026 balance', () => {
    const n = atomicToEgld('2092829414170740160')
    expect(n).toBeGreaterThan(2.09)
    expect(n).toBeLessThan(2.1)
  })
  it('handles empty / junk', () => {
    expect(atomicToEgld('')).toBe(0)
    expect(atomicToEgld('nope')).toBe(0)
    expect(atomicToEgld(undefined)).toBe(0)
  })
})

describe('gates', () => {
  it('codeHash null is empty', () => {
    expect(isCodeEmpty(null)).toBe(true)
    expect(isCodeEmpty('abc')).toBe(false)
  })
  it('LIA ops funded threshold', () => {
    expect(liaOpsFunded(0.093)).toBe(false)
    expect(liaOpsFunded(2.09)).toBe(true)
  })
  it('supernova age from epoch 2241', () => {
    expect(supernovaAgeEpochs(2241)).toBe(8)
    expect(supernovaAgeEpochs(2233)).toBe(0)
  })
})
