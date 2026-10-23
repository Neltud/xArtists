/**
 * Application-layer guard: refuse claimFees unless explicit ops conditions.
 * SC-level require_owner is the on-chain guarantee; this blocks accidental ops scripts.
 *
 * Usage: node scripts/claim_fees_guard.mjs
 * Exit 0 only when all gates pass — still does NOT broadcast.
 */
const dest = process.env.TREASURY_DEST || process.env.CLAIM_FEES_DEST || ''
const live = process.env.LIA_LIVE_TRADING === '1'
const armed = process.env.GUARDIAN_ARMED === '1'
const codehashOk = process.env.CLAIM_FEES_CODEHASH_OK === '1'
const proof = process.env.CLAIM_FEES_OPS_PROOF || ''

const failures = []
if (!dest || !/^erd1[a-z0-9]{58}$/i.test(dest)) failures.push('treasury_dest_null_or_invalid')
if (live) failures.push('lia_live_trading_must_be_0_for_claim_guard')
if (!armed) failures.push('guardian_not_armed')
if (!codehashOk) failures.push('codehash_not_verified')
if (!proof || proof.length < 16) failures.push('ops_proof_missing')

if (failures.length) {
  console.log(JSON.stringify({ ok: false, action: 'claimFees', blocked: true, failures }))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, action: 'claimFees', blocked: false, note: 'gates_pass_still_no_broadcast' }))
