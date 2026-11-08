// Static safety regression checks: these do NOT compile or execute the smart contract.
// Run: node --test contracts/rwa-escrow-bridge/tests/release_gates.static.test.mjs
// Maps to docs/RWA_ESCROW_RELEASE_GATES_DRAFT_2026-11-08.md points 1-5.
// Points 6-7 (VM migration, E2E fiat/vault) require MultiversX tooling and ops mocks.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/lib.rs', import.meta.url), 'utf8')

const GATES = [
  'receipt_confirmed',
  'verification_confirmed',
  'quality_confirmed',
  'ownership_confirmed',
]

const method = (start, end) => {
  const a = source.indexOf(start)
  const b = source.indexOf(end, a + start.length)
  assert.ok(a >= 0 && b > a, `missing function boundaries: ${start}`)
  return source.slice(a, b)
}

const releaseBody = () => method('fn release(', 'fn release_to_seller(')
const disputeSeller = () => {
  const body = method('fn resolve_dispute(', '#[endpoint(refund)]')
  const seller = body.slice(body.indexOf('if favor_seller {'), body.indexOf('} else {'))
  assert.ok(seller.length > 0, 'favor_seller branch missing')
  return seller
}

test('P1: single attestation endpoints never pay the seller', () => {
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

test('P1/P2: release requires all four independent gates before payout', () => {
  const body = releaseBody()
  for (const gate of GATES) {
    assert.match(body, new RegExp(`require!\\(esc\\.${gate}`))
  }
  assert.match(body, /self\.release_to_seller\(id, &mut esc\)/)
})

test('P2: each gate is a separate storage flag (pair alone cannot satisfy release)', () => {
  // Structural guarantee: release ANDs four distinct fields; no compound OR shortcut.
  const body = releaseBody()
  assert.doesNotMatch(body, /receipt_confirmed\s*\|\|/
  )
  assert.doesNotMatch(body, /verification_confirmed\s*\|\|/
  )
  for (const gate of GATES) {
    assert.match(source, new RegExp(`pub ${gate}: bool`))
  }
})

test('P3: release and attestations are attestor-only; receipt is payer-only', () => {
  const release = releaseBody()
  assert.match(release, /self\.blockchain\(\)\.get_caller\(\) == self\.attestor\(\)\.get\(\)/)
  assert.doesNotMatch(release, /esc\.payer/)

  const receipt = method('fn confirm_receipt(', 'fn submit_verification_proof(')
  assert.match(receipt, /get_caller\(\) == esc\.payer/)
  assert.doesNotMatch(receipt, /attestor/)

  for (const [start, end] of [
    ['fn submit_verification_proof(', 'fn attest_quality_inspection('],
    ['fn attest_quality_inspection(', 'fn attest_ownership_reassignment('],
    ['fn attest_ownership_reassignment(', 'fn release('],
  ]) {
    assert.match(method(start, end), /only attestor|get_caller\(\) == self\.attestor\(\)\.get\(\)/)
  }
})

test('P4: dispute, refund and cancel set terminal states that block open release', () => {
  assert.match(method('fn open_dispute(', '#[endpoint(resolveDispute)]'), /esc\.status = 4u8/)
  assert.match(method('fn refund(', '#[endpoint(cancelByOwner)]'), /esc\.status = 2u8/)
  assert.match(method('fn cancel_by_owner(', '#[view(getEscrow)]'), /esc\.status = 3u8/)
  assert.match(releaseBody(), /esc\.status == 0u8/)
  // release_to_seller writes Released (1) before transfer — replay path must see non-open status
  const pay = method('fn release_to_seller(', '#[endpoint(openDispute)]')
  assert.ok(pay.indexOf('esc.status = 1u8') < pay.indexOf('direct_egld'))
})

test('P5: empty or oversize proof hashes rejected; trade ids isolated', () => {
  for (const start of [
    'fn submit_verification_proof(',
    'fn attest_quality_inspection(',
    'fn attest_ownership_reassignment(',
  ]) {
    const end =
      start.includes('submit_verification')
        ? 'fn attest_quality_inspection('
        : start.includes('attest_quality')
          ? 'fn attest_ownership_reassignment('
          : 'fn release('
    const body = method(start, end)
    assert.match(body, /len\(\) > 0/)
    assert.match(body, /MAX_HASH_LEN/)
  }
  assert.match(source, /trade already escrowed/)
  assert.match(source, /trade_escrow_id/)
})

test('quality attestation retains auditable proof hash', () => {
  assert.match(source, /pub quality_proof_hash: ManagedBuffer<M>/)
  const body = method('fn attest_quality_inspection(', 'fn attest_ownership_reassignment(')
  assert.match(body, /esc\.quality_proof_hash = quality_hash/)
  assert.match(body, /esc\.quality_confirmed = true/)
})

test('dispute resolution cannot release seller funds without all four gates', () => {
  const seller = disputeSeller()
  for (const gate of GATES) {
    assert.match(seller, new RegExp('require!\\(esc\\.' + gate))
  }
  assert.ok(seller.indexOf('require!(esc.ownership_confirmed') < seller.indexOf('direct_egld'))
})

test('payment helper is private and CEI-ordered', () => {
  const body = method('fn release_to_seller(', '#[endpoint(openDispute)]')
  assert.ok(body.indexOf('esc.status = 1u8') < body.indexOf('direct_egld'))
  assert.doesNotMatch(source, /#\[endpoint\([^\]]+\)\]\s*fn release_to_seller/)
})

test('P6 residual risk: owner can refund or cancel without the four gates', () => {
  // Documented residual authority — must be constrained by multisig policy, not code alone.
  const refund = method('fn refund(', '#[endpoint(cancelByOwner)]')
  assert.match(refund, /is_owner|get_owner|only owner/)
  assert.doesNotMatch(refund, /receipt_confirmed/)
  const cancel = method('fn cancel_by_owner(', '#[view(getEscrow)]')
  assert.match(cancel, /require_owner/)
  assert.doesNotMatch(cancel, /receipt_confirmed/)
})

test('ownership transfer is two-step (pending + accept)', () => {
  assert.match(source, /fn transfer_ownership/)
  assert.match(source, /fn accept_ownership/)
  assert.match(source, /pending_owner/)
  const accept = method('fn accept_ownership(', '#[payable')
  assert.match(accept, /caller == self\.pending_owner\(\)\.get\(\)/)
})
