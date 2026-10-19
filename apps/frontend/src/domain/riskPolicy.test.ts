import { describe, expect, it } from 'vitest'
import { RISK_CAPS, checkPolicy, type PolicyInput } from './riskPolicy'

const okInput: PolicyInput = {
  chainId: 'mvx',
  walletRole: 'user',
  amountUsd: 3,
  spentUsdToday: 0,
  slippageBps: 30,
  liveTradingEnabled: false,
  amountAtomic: '1000000000000000000',
}

describe('riskPolicy', () => {
  it('accepts under-cap user order', () => {
    expect(checkPolicy(okInput)).toEqual({ ok: true })
  })

  it('rejects over per-order cap', () => {
    const r = checkPolicy({ ...okInput, amountUsd: RISK_CAPS.maxUsdPerOrder + 0.01 })
    expect(r).toEqual({ ok: false, reason: 'over_per_order_cap' })
  })

  it('rejects over daily cap', () => {
    const r = checkPolicy({
      ...okInput,
      amountUsd: 5,
      spentUsdToday: 11,
    })
    expect(r).toEqual({ ok: false, reason: 'over_daily_cap' })
  })

  it('rejects high slippage', () => {
    const r = checkPolicy({ ...okInput, slippageBps: RISK_CAPS.maxSlippageBps + 1 })
    expect(r).toEqual({ ok: false, reason: 'over_slippage_cap' })
  })

  it('rejects NaN amount', () => {
    const r = checkPolicy({ ...okInput, amountUsd: Number.NaN })
    expect(r).toEqual({ ok: false, reason: 'invalid_amount_usd' })
  })

  it('rejects non-atomic amount string', () => {
    const r = checkPolicy({ ...okInput, amountAtomic: '1.5e18' })
    expect(r).toEqual({ ok: false, reason: 'invalid_amount_atomic' })
  })

  it('blocks LIA Ops when live trading off', () => {
    const r = checkPolicy({
      ...okInput,
      walletRole: 'lia_ops',
      liveTradingEnabled: false,
    })
    expect(r).toEqual({ ok: false, reason: 'lia_ops_paper_only' })
  })

  it('allows LIA Ops only when live flag true (still needs human path elsewhere)', () => {
    const r = checkPolicy({
      ...okInput,
      walletRole: 'lia_ops',
      liveTradingEnabled: true,
    })
    expect(r).toEqual({ ok: true })
  })
})
