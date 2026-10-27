/**
 * Rule 1 pack quote — client anchors, parity fiat↔crypto, ceil EGLD.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildPackQuote,
  isQuoteExpired,
  PACK_FIAT_CENTS,
  RULE1,
  ceilDp,
} from '../src/quote.mjs'

test('client amounts are fiat anchors only', () => {
  const q = buildPackQuote({ pack_id: 'pulse', rate_eur_per_egld: 12 })
  assert.equal(q.amount_cents, 11000)
  assert.equal(q.amount_eur, 110)
  assert.equal(q.margin_internal, 0.04)
})

test('yield and sentinel anchors', () => {
  assert.equal(buildPackQuote({ pack_id: 'yield', rate_eur_per_egld: 12 }).amount_cents, 7500)
  assert.equal(buildPackQuote({ pack_id: 'sentinel', rate_eur_per_egld: 12 }).amount_cents, 5000)
})

test('crypto leg equals fiat anchor at rate (parity, not /1.04)', () => {
  assert.equal(ceilDp(110 / 12, 4), 9.1667)
  const q = buildPackQuote({ pack_id: 'pulse', rate_eur_per_egld: 12 })
  assert.equal(q.amount_egld, 9.1667)
  const implied = q.amount_egld * 12
  assert.ok(Math.abs(implied - 110) <= RULE1.toleranceEur + 1e-9)
})

test('parity holds for all packs', () => {
  for (const id of Object.keys(PACK_FIAT_CENTS)) {
    const q = buildPackQuote({ pack_id: id, rate_eur_per_egld: 10 })
    const implied = q.amount_egld * 10
    assert.ok(
      Math.abs(implied - q.amount_eur) <= RULE1.toleranceEur + 1e-9,
      `${id} gap ${Math.abs(implied - q.amount_eur)}`,
    )
  }
})

test('unknown pack rejected', () => {
  assert.throws(() => buildPackQuote({ pack_id: 'gold', rate_eur_per_egld: 12 }), /unknown_pack/)
})

test('invalid rate rejected', () => {
  assert.throws(() => buildPackQuote({ pack_id: 'pulse', rate_eur_per_egld: 0 }), /invalid_fx/)
})

test('quote expiry', () => {
  const now = 1_000_000
  const q = buildPackQuote({ pack_id: 'pulse', rate_eur_per_egld: 12, now })
  assert.equal(isQuoteExpired(q, now + 1000), false)
  assert.equal(isQuoteExpired(q, now + RULE1.quoteTtlMs + 1), true)
})

test('all catalog packs quote', () => {
  for (const id of Object.keys(PACK_FIAT_CENTS)) {
    const q = buildPackQuote({ pack_id: id, rate_eur_per_egld: 10 })
    assert.equal(q.ok, true)
    assert.ok(q.amount_egld > 0)
    assert.ok(q.rounding_gap_eur <= RULE1.toleranceEur + 1e-9)
  }
})
