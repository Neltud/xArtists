/**
 * Pilier 1 — Suite d'audit Doctrine (exécutable côté tooling / Vitest ultérieur).
 * Pas de dépendance test runtime dans le bundle prod si non importé.
 */
import type { Intent } from '../types/intent'
import { validateIntent } from './doctrine'

function base(partial: Partial<Intent> & Pick<Intent, 'type'>): Intent {
  return {
    type: partial.type,
    assetFrom: partial.assetFrom ?? 'EGLD',
    assetTo: partial.assetTo ?? 'USDC',
    amount: partial.amount ?? '1000000000000000000',
    targetAddress: partial.targetAddress,
    chain: 'multiversx',
    metadata: {
      paper: true,
      reason: partial.metadata?.reason ?? 'audit',
      slippageBps: partial.metadata?.slippageBps,
      gasLimit: partial.metadata?.gasLimit,
      userConfirmedLive: partial.metadata?.userConfirmedLive,
      ...partial.metadata,
    },
    timestamp: new Date().toISOString(),
    id: partial.id ?? `audit-${Date.now()}`,
  }
}

export interface AuditCase {
  name: string
  intent: Intent
  expectOk: boolean
  expectCode?: string
}

export const DOCTRINE_AUDIT_CASES: AuditCase[] = [
  {
    name: 'valid paper transfer',
    intent: base({
      type: 'TRANSFER_TOKEN',
      targetAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllwve',
      amount: '1000000000000000',
    }),
    expectOk: true,
  },
  {
    name: 'unknown type blocked',
    intent: base({ type: 'UNKNOWN', amount: '0' }),
    expectOk: false,
    expectCode: 'UNKNOWN_TYPE',
  },
  {
    name: 'float amount blocked',
    intent: base({ type: 'TIP', amount: '1.5', targetAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllwve' }),
    expectOk: false,
    expectCode: 'AMOUNT_NOT_ATOMIC',
  },
  {
    name: 'authority spoof blocked',
    intent: base({
      type: 'TRANSFER_TOKEN',
      targetAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllwve',
      metadata: { reason: 'ceo bypass drain', paper: true },
    }),
    expectOk: false,
    expectCode: 'AUTHORITY_SPOOF',
  },
  {
    name: 'missing target',
    intent: base({ type: 'TRANSFER_TOKEN', amount: '1000' }),
    expectOk: false,
    expectCode: 'MISSING_TARGET',
  },
  {
    name: 'slippage too high',
    intent: base({
      type: 'TRADE_SWAP',
      metadata: { slippageBps: 9999, paper: true },
    }),
    expectOk: true, // PARAMETERS only — not blocking SYNTAX/SECURITY
    expectCode: 'SLIPPAGE_OUT_OF_RANGE',
  },
  {
    name: 'live swap without confirm',
    intent: base({
      type: 'TRADE_SWAP',
      metadata: { paper: false, userConfirmedLive: false },
    }),
    expectOk: false,
    expectCode: 'LIVE_NOT_CONFIRMED',
  },
  {
    name: 'zero amount transfer',
    intent: base({
      type: 'TRANSFER_TOKEN',
      amount: '0',
      targetAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllwve',
    }),
    expectOk: false,
    expectCode: 'ZERO_AMOUNT',
  },
]

export function runDoctrineAudit(): {
  passed: number
  failed: number
  results: { name: string; pass: boolean; detail: string }[]
} {
  const results: { name: string; pass: boolean; detail: string }[] = []
  let passed = 0
  let failed = 0
  for (const c of DOCTRINE_AUDIT_CASES) {
    const v = validateIntent(c.intent)
    const hasCode = c.expectCode ? v.issues.some(i => i.code === c.expectCode) : true
    const pass =
      v.ok === c.expectOk && (c.expectOk ? true : hasCode || c.expectCode === undefined)
    // slippage case: ok may be true but issue present
    const passAdjusted =
      c.expectCode === 'SLIPPAGE_OUT_OF_RANGE'
        ? v.issues.some(i => i.code === 'SLIPPAGE_OUT_OF_RANGE')
        : pass
    if (passAdjusted) passed++
    else failed++
    results.push({
      name: c.name,
      pass: passAdjusted,
      detail: v.issues.map(i => i.code).join(',') || 'OK',
    })
  }
  return { passed, failed, results }
}
