import { describe, expect, it } from 'vitest'
import { canonicalDigestJson, hashDigest, isDigestExpired, type OrderDigestFields } from './orderDigest'

const base: OrderDigestFields = {
  chainId: 'mvx',
  walletAddress: 'erd1qqqqqqqqqqqqqpgqtest',
  walletRole: 'user',
  intentId: 'pack:sentinel',
  amountAtomic: '2500000000000000000',
  tokenIn: 'EGLD',
  tokenOut: 'NFT_PACK',
  slippageBps: 50,
  quoteId: 'q-1',
  expiry: 2_000_000_000,
}

describe('orderDigest', () => {
  it('hash is stable for same fields', () => {
    const a = hashDigest(base)
    const b = hashDigest({ ...base })
    expect(a).toBe(b)
    expect(a.startsWith('xd1_')).toBe(true)
  })

  it('hash changes when amount changes', () => {
    const a = hashDigest(base)
    const b = hashDigest({ ...base, amountAtomic: '1' })
    expect(a).not.toBe(b)
  })

  it('normalizes wallet address case', () => {
    const a = hashDigest(base)
    const b = hashDigest({ ...base, walletAddress: base.walletAddress.toUpperCase() })
    expect(a).toBe(b)
  })

  it('canonical JSON is key-sorted stable', () => {
    const j = canonicalDigestJson(base)
    expect(j).toContain('"amountAtomic"')
    expect(j.indexOf('amountAtomic')).toBeLessThan(j.indexOf('walletRole'))
  })

  it('detects expiry', () => {
    expect(isDigestExpired(base, base.expiry - 1)).toBe(false)
    expect(isDigestExpired(base, base.expiry)).toBe(true)
  })
})
