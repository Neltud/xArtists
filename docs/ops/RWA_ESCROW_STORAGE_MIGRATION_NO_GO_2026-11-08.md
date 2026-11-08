# RWA escrow — storage compatibility decision (2026-11-08)

**Mainnet upgrade: NO-GO.** This PR's `Escrow` type derives TopEncode/TopDecode and is stored under `#[storage_mapper("escrows")]`. A change in fields changes the serialized binary layout of existing records. An in-place upgrade can make historic escrows fail to decode. Static Rust/JS tests do not prove an upgrade is safe.

## Exact source layout

Legacy fields in canonical order:
`trade_id, payer, seller, amount, meta_hash, deadline, status, dispute_opened_at, proof_hash`.

PR #430 appends six fields:
`receipt_confirmed, verification_confirmed, quality_confirmed, quality_proof_hash, ownership_confirmed, ownership_proof_hash`.

The new struct is **NOT** byte-compatible with the historical mapper. It does not fix old records by appending zero values. New release guards are only meaningful after a verified migration.

## Safe design options — decision and evidence required

**Option A: separate v2 contract** (preferred if legally viable)
1. Verify v1 contract address, codehash, owner, current locked EGLD, escrow IDs and exact settlement/refund state from independent on-chain readback. Freeze new v1 deposits only with authorized governance if supported.
2. Keep v1 executable solely to settle/dispute/refund historic positions under existing legal terms and existing ABI. Do **not** transfer locked EGLD or reopen escrows by admin assertion.
3. Deploy independently reviewed v2 contract with versioned storage and explicit provenance/quality/receipt gates; no automatic migration of funds.
4. Fund a v2 escrow only by the payer's new, explicit wallet-approved transaction and a distinct verified legal handoff.
5. Reconcile and audit v1 + v2 ledgers; never say an RWA changed owners based only on NFT custody.

**Option B: versioned in-place storage adapter** (higher risk)
1. Preserve legacy field order, encodings, mapper keys, and ABI. Decode each legacy position using an explicit versioned legacy `EscrowV1` type, and use separate v2 storage/map keys for new fields or records.
2. Supply a deterministic, bounded migration entry point, only after verified external snapshots and an on-chain immutable migration status marker. Every record must be either safely converted or fail closed.
3. Ensure paused state, release holds, attestor permissions, disputes, and funds do not reset on upgrade. Test rollback/recovery with representative historic snapshots and proper VM scenario.
4. Obtain independent smart-contract audit and an authorized owner-signed transaction after an explicit reviewed upgrade plan. Never run ad hoc script migrations against public mainnet.

## Evidence pack still missing

- Authenticated live contract/escrow inventory with source, block height and independent explorer readback
- Exact legacy binary bytes and VM tests loading live-like historic mapper values
- Invariant proofs: no stuck funds, no lost disputes, no replay, no wrong beneficiary, no bypass of multi-party release
- Attestor revocation, trusted oracle/human evidence provenance, controls against false physical title assertions
- Operator/governance approval and chain-specific rollback/runbook

The new test `contracts/rwa-escrow-bridge/tests/legacy_storage_no_go.test.mjs` proves the **existence** of the mismatch; success on this test is deliberately negative evidence for a direct upgrade. PR #430 remains draft, and **must not** be merged/deployed as production contract upgrade based only on green CI.
