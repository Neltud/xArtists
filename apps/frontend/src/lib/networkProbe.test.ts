import { describe, expect, it } from 'vitest'
import {
  atomicToEgld,
  FALLBACK_SNAPSHOT,
  isCodeEmpty,
  liaOpsFunded,
  supernovaAgeEpochs,
} from './networkProbe'

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
  it('supernova age from epoch 2242 is J+9', () => {
    expect(supernovaAgeEpochs(2242)).toBe(9)
    expect(supernovaAgeEpochs(2233)).toBe(0)
  })
})

describe('fallback snapshot 24 sept', () => {
  it('is fail-closed and marks stale accounts', () => {
    expect(FALLBACK_SNAPSHOT.sc.marketplace.codeEmpty).toBe(true)
    expect(FALLBACK_SNAPSHOT.liaOps.stale).toBe(true)
    expect(FALLBACK_SNAPSHOT.degraded).toBe(true)
    expect(FALLBACK_SNAPSHOT.epoch).toBe(2242)
    expect(FALLBACK_SNAPSHOT.refreshRate).toBe(600)
  })
})
