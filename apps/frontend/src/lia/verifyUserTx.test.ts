import { describe, expect, it } from 'vitest'
import { interpretAccountTx, normalizeTxHash } from './verifyUserTx'

const HASH = 'ab'.repeat(32)
const ME = 'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'

describe('normalizeTxHash', () => {
  it('accepts 64 hex and strips 0x', () => {
    expect(normalizeTxHash(`0x${HASH.toUpperCase()}`)).toBe(HASH)
  })
  it('rejects short or spaced strings', () => {
    expect(normalizeTxHash('deadbeef')).toBeNull()
    expect(normalizeTxHash(`${HASH} `)).toBe(HASH)
    expect(normalizeTxHash('zz'.repeat(32))).toBeNull()
  })
})

describe('interpretAccountTx', () => {
  it('accepts success from the connected sender', () => {
    const v = interpretAccountTx({ status: 'success', sender: ME }, ME, HASH)
    expect(v.ok).toBe(true)
  })
  it('refuses another sender', () => {
    const v = interpretAccountTx({ status: 'success', sender: 'erd1other' }, ME, HASH)
    expect(v.ok).toBe(false)
  })
  it('refuses pending, failed, missing, and anonymous', () => {
    expect(interpretAccountTx({ status: 'pending', sender: ME }, ME, HASH).ok).toBe(false)
    expect(interpretAccountTx({ status: 'fail', sender: ME }, ME, HASH).ok).toBe(false)
    expect(interpretAccountTx(null, ME, HASH).ok).toBe(false)
    expect(interpretAccountTx({ status: 'success', sender: ME }, '', HASH).ok).toBe(false)
  })
})
