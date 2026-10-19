import { describe, expect, it } from 'vitest'
import {
  attachQuote,
  createDraftOrder,
  markApproved,
  markConfirmed,
  markSubmitted,
  markUnknown,
  requestHumanApproval,
  runPolicyCheck,
} from './orderPipeline'
import type { DraftIntent } from './types'

const intent: DraftIntent = {
  chainId: 'mvx',
  walletAddress: 'erd1user000000000000000000000000000000000000000000000000',
  walletRole: 'user',
  intentId: 'pack:sentinel',
  tokenIn: 'EGLD',
  tokenOut: 'NFT_PACK',
}

function quote(over = false) {
  return {
    amountAtomic: '2500000000000000000',
    amountUsd: over ? 9 : 3,
    slippageBps: 30,
    quoteId: 'q-test',
    expiry: Math.floor(Date.now() / 1000) + 600,
  }
}

describe('orderPipeline', () => {
  it('runs draft → quote → policy → await approval → approved → submitted → confirmed', () => {
    const d = createDraftOrder(intent)
    expect(d.ok).toBe(true)
    if (!d.ok) return

    const q = attachQuote(d.value, quote())
    expect(q.ok).toBe(true)
    if (!q.ok) return
    expect(q.value.state).toBe('QUOTED')
    expect(q.value.digestHash?.startsWith('xd1_')).toBe(true)

    const p = runPolicyCheck(q.value)
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.value.state).toBe('POLICY_CHECKED')

    const a = requestHumanApproval(p.value)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    expect(a.value.state).toBe('AWAITING_HUMAN_APPROVAL')

    const bad = markApproved(a.value, 'wrong-hash')
    expect(bad.ok).toBe(false)

    const ok = markApproved(a.value, a.value.digestHash!)
    expect(ok.ok).toBe(true)
    if (!ok.ok) return
    expect(ok.value.state).toBe('APPROVED')

    const s = markSubmitted(ok.value)
    expect(s.ok).toBe(true)
    if (!s.ok) return

    const c = markConfirmed(s.value)
    expect(c.ok).toBe(true)
    if (!c.ok) return
    expect(c.value.state).toBe('CONFIRMED')
  })

  it('rejects over-cap at policy', () => {
    const d = createDraftOrder(intent)
    if (!d.ok) return
    const q = attachQuote(d.value, quote(true))
    if (!q.ok) return
    const p = runPolicyCheck(q.value)
    expect(p.ok).toBe(false)
    if (p.ok) return
    expect(p.reason).toBe('over_per_order_cap')
  })

  it('UNKNOWN is fail-closed from SUBMITTED', () => {
    const d = createDraftOrder(intent)
    if (!d.ok) return
    let o = attachQuote(d.value, quote())
    if (!o.ok) return
    o = runPolicyCheck(o.value)
    if (!o.ok) return
    o = requestHumanApproval(o.value)
    if (!o.ok) return
    o = markApproved(o.value, o.value.digestHash!)
    if (!o.ok) return
    o = markSubmitted(o.value)
    if (!o.ok) return
    const u = markUnknown(o.value)
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.value.state).toBe('UNKNOWN')
  })

  it('blocks LIA Ops when live trading disabled', () => {
    const d = createDraftOrder(
      { ...intent, walletRole: 'lia_ops' },
      { liveTradingEnabled: false },
    )
    if (!d.ok) return
    const q = attachQuote(d.value, quote())
    if (!q.ok) return
    const p = runPolicyCheck(q.value)
    expect(p.ok).toBe(false)
    if (p.ok) return
    expect(p.reason).toBe('lia_ops_paper_only')
  })
})
