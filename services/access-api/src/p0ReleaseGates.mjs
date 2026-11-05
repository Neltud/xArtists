/** Conservative P0 release-gate evaluator. Evidence must be supplied by trusted
 * operator verification; never from browser input. No side effects.
 */
export const P0_RELEASE_GATES = Object.freeze({
  delivery: Object.freeze(['production_db_bound','signed_psp_settlement','atomic_delivery_commit','independent_nft_owner_readback','refund_recovery_test']),
  media: Object.freeze(['artist_rights_attested','source_sha256_verified','primary_ipfs_readback','independent_replica_readback','restore_test']),
  payments: Object.freeze(['signed_mandate_ledger','fiat_crypto_adapters_separated','replay_protection_test','psp_chain_reconciliation','compensation_test']),
  genesis: Object.freeze(['authorized_minter_verified','media_cids_verified','transaction_specific_wallet_approval','mainnet_receipt_verified','recipient_owner_verified']),
})
const PROOF = /^[a-f0-9]{64}$/i
const blocked = (scope, missing) => Object.freeze({scope,ready:false,missing,commercial_go:false})
/** Proof record: { gate: { verified:true, evidence_sha256:'64 hex', reviewed_at:'ISO', reviewer:'...' }} */
export function evaluateP0Gate(scope, evidence = {}) {
  const required = P0_RELEASE_GATES[scope]
  if (!required) throw new Error('unknown_p0_scope')
  const missing = required.filter(gate => {
    const p = evidence?.[gate]
    if (p?.verified !== true || !PROOF.test(p.evidence_sha256 || '') ||
        typeof p.reviewer !== 'string' || p.reviewer.trim().length < 2 ||
        typeof p.reviewed_at !== 'string') return true
    const t = Date.parse(p.reviewed_at)
    return !Number.isFinite(t) || new Date(t).toISOString() !== p.reviewed_at ||
      t > Date.now()
  })
  if (missing.length) return blocked(scope, missing)
  // Independent production authorization remains mandatory even if every gate is documented.
  return Object.freeze({scope,ready:true,missing:[],commercial_go:false,
    reason:'independent_release_authorization_required'})
}
export function evaluateP0Sprint(evidenceByScope = {}) {
  const scopes = Object.keys(P0_RELEASE_GATES)
  const results = scopes.map(scope => evaluateP0Gate(scope, evidenceByScope[scope]))
  return Object.freeze({results,commercial_go:false,all_evidence_ready:results.every(r=>r.ready)})
}
