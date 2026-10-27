/**
 * Residual B: percent-encoded contradictory duplicates must be rejected.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSignedIpnFields } from '../src/paybox.mjs'

test('percent-encoded key collision amount vs amoun%74 rejected when values differ', () => {
  const raw = 'amount=11000&amoun%74=7500&ref=ord_1&error=00000'
  assert.equal(parseSignedIpnFields(raw), null)
})

test('percent-encoded same value still ok', () => {
  const raw = 'amount=11000&amoun%74=11000&ref=ord_1&error=00000'
  assert.ok(parseSignedIpnFields(raw))
  assert.equal(parseSignedIpnFields(raw).amount_cents, 11000)
})

test('plain conflicting amount keys still rejected', () => {
  assert.equal(parseSignedIpnFields('amount=11000&amount=7500&ref=ord_1&error=00000'), null)
})
