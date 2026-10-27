/**
 * IPN HTTP edge cases — body limits, malformed payload, strict amount, encoded duplicates.
 * Does not touch SIWX session (#192).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSignedIpnFields, resolveIpnAuthenticatedSource, extractRawSignedData } from '../src/paybox.mjs'
import { startServer } from './server-fixture.mjs'

test('strict amount rejects partial numeric strings', () => {
  const base = 'amount=11000&ref=ord_1&error=00000&auto=XXXX&idtrans=1'
  assert.ok(parseSignedIpnFields(base))
  assert.equal(parseSignedIpnFields(base.replace('11000', '11000abc')), null)
  assert.equal(parseSignedIpnFields(base.replace('11000', '11_000')), null)
  assert.equal(parseSignedIpnFields(base.replace('11000', '-11000')), null)
  assert.equal(parseSignedIpnFields(base.replace('11000', '0')), null)
  assert.equal(parseSignedIpnFields(base.replace('11000', '11000.5')), null)
})

test('conflicting encoded duplicate business keys are rejected', () => {
  assert.equal(parseSignedIpnFields('amount=11000&amount=7500&ref=ord_1&error=00000'), null)
  assert.equal(parseSignedIpnFields('amount=11000&M=7500&ref=ord_1&error=00000'), null)
  assert.ok(parseSignedIpnFields('amount=11000&M=11000&ref=ord_1&error=00000'))
})

test('ambiguous query+body signed sources rejected', () => {
  const r = resolveIpnAuthenticatedSource(
    'amount=1&ref=r&error=00000&sign=abc',
    'amount=1&ref=r&error=00000&sign=abc',
  )
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'ambiguous_signed_sources')
})

test('missing sign segment yields missing_or_ambiguous_signed_payload', () => {
  assert.equal(extractRawSignedData('amount=1&ref=r&error=00000'), null)
  const r = resolveIpnAuthenticatedSource('amount=1&ref=r&error=00000', '')
  assert.equal(r.ok, false)
})

test('HTTP IPN: malformed JSON body returns 400 invalid_json', async () => {
  const server = await startServer()
  try {
    const res = await fetch(`${server.base}/v1/checkout/paybox/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    })
    assert.equal(res.status, 400)
    const j = await res.json()
    assert.equal(j.ok, false)
    assert.equal(j.error, 'invalid_json')
  } finally {
    await server.close()
  }
})

test('HTTP IPN: oversized body returns 413 body_too_large', async () => {
  const server = await startServer()
  try {
    const big = 'x'.repeat(20_000)
    const res = await fetch(`${server.base}/v1/checkout/paybox/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: big,
    })
    assert.equal(res.status, 413)
    const j = await res.json()
    assert.equal(j.ok, false)
    assert.equal(j.error, 'body_too_large')
  } finally {
    await server.close()
  }
})

test('HTTP IPN: form body without signed payload is 400 missing_or_ambiguous', async () => {
  const server = await startServer()
  try {
    const res = await fetch(`${server.base}/v1/checkout/paybox/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'foo=bar',
    })
    assert.equal(res.status, 400)
    const j = await res.json()
    assert.equal(j.ok, false)
    assert.ok(
      String(j.error).includes('signed') || j.error === 'missing_or_ambiguous_signed_payload',
    )
  } finally {
    await server.close()
  }
})
