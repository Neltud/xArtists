// Static safety regression checks: these do NOT compile or execute the smart contract.
// Run: node --test contracts/rwa-escrow-bridge/tests/release_gates.static.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../src/lib.rs', import.meta.url), 'utf8')
const method = (start, end) => {
  const a = source.indexOf(start)
  const b = source.indexOf(end, a + start.length)
  assert.ok(a >= 0 && b > a, `missing function boundaries: ${start}`)
  return source.slice(a, b)
}
test('receipt and authenticity attestations never directly pay seller', () => {
  for (const [start, end] of [
    ['fn confirm_receipt(', 'fn submit_verification_proof('],
    ['fn submit_verification_proof(', 'fn attest_quality_inspection('],
    ['fn attest_quality_inspection(', 'fn attest_ownership_reassignment('],
    ['fn attest_ownership_reassignment(', 'fn release('],
  ]) {
    const body = method(start, end)
    assert.doesNotMatch(body, /release_to_seller|direct_egld|send\(\)/)
    assert.match(body, /esc\.status == 0u8/)
  }
})
test('release is attestor-only and requires independent gates', () => {
  const body = method('fn release(', 'fn release_to_seller(')
  for (const gate of ['receipt_confirmed', 'verification_confirmed', 'quality_confirmed', 'ownership_confirmed']) {
    assert.match(body, new RegExp(`require!\\(esc\\.${gate}`))
  }
  assert.match(body, /self\.blockchain\(\)\.get_caller\(\) == self\.attestor\(\)\.get\(\)/)
  assert.match(body, /esc\.status == 0u8/)
  assert.match(body, /self\.release_to_seller\(id, &mut esc\)/)
})
test('payment helper is private and writes terminal state before transfer', () => {
  const body = method('fn release_to_seller(', '#[endpoint(openDispute)]')
  assert.ok(body.indexOf('esc.status = 1u8') < body.indexOf('direct_egld'))
  assert.doesNotMatch(source, /#\[endpoint\([^\]]+\)\]\s*fn release_to_seller/)
})
test('dispute and refund are not bypassed by normal release', () => {
  assert.match(method('fn open_dispute(', '#[endpoint(resolveDispute)]'), /esc\.status = 4u8/)
  assert.match(method('fn refund(', '#[endpoint(cancelByOwner)]'), /esc\.status == 0u8/)
  assert.match(method('fn release(', 'fn release_to_seller('), /esc\.status == 0u8/)
})

test('quality attestation retains auditable proof hash', () => {
  assert.match(source, /pub quality_proof_hash: ManagedBuffer<M>/)
  assert.match(source, /quality_proof_hash: ManagedBuffer::new\(\)/)
  const body = method('fn attest_quality_inspection(', 'fn attest_ownership_reassignment(')
  assert.match(body, /esc\.quality_proof_hash = quality_hash/)
  assert.match(body, /esc\.quality_confirmed = true/)
})
test('dispute resolution cannot release seller funds without all four gates', () => {
  const body = method('fn resolve_dispute(', '#[endpoint(refund)]')
  const seller = body.slice(body.indexOf('if favor_seller {'), body.indexOf('} else {'))
  assert.ok(seller.length > 0)
  for (const gate of ['receipt_confirmed','verification_confirmed','quality_confirmed','ownership_confirmed']) {
    assert.match(seller, new RegExp('require!\\(esc\\.' + gate))
  }
  assert.ok(seller.indexOf('require!(esc.ownership_confirmed') < seller.indexOf('direct_egld'))
})
