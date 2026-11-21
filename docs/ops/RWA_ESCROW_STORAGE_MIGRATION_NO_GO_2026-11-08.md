# RWA escrow — storage compatibility decision (2026-11-08)

**Mainnet upgrade: NO-GO.** This PR's `Escrow` type derives TopEncode/TopDecode and is stored under `#[storage_mapper("escrows")]`. A change in fields changes the serialized binary layout of existing records. An in-place upgrade can make historic escrows fail to decode. Static Rust/JS tests do not prove an upgrade is safe.

## What is actually deployed?

The current `main` configuration `data/contracts.json` lists **no**
`rwa-escrow-bridge` mainnet address, and the public UI labels the escrow
contract pre-mainnet/not live. This is not proof that no independently
deployed legacy instance exists. **Do not claim existing customer escrows,
balances or legal positions until an independently verified contract address
and state snapshot are obtained.**

If there is genuinely no deployed v1 contract and no locked funds, **a new
audited v2 deployment** is preferable to any migration. The legacy layout
compatibility gate still prevents an unsafe upgrade if a v1 instance is
identified later.

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


## Compiled RustVM evidence — 2026-11-08

The repo previously had only JS source-pattern checks; compiling the isolated 0.50 contract
disclosed and fixed three real errors:
- Cargo project needed an isolated `[workspace]` for its own 0.50 toolchain.
- The contract uses `#[upgrade]` rather than the unsupported `#[endpoint(upgrade)]` form.
- `openEscrow` event's two unindexed fields (amount and deadline) must be encoded
  as one `EscrowOpenedData` event payload, and `SingleValueMapper::set` must
  immutably reborrow the escrow before post-write payment fields are read.

**Verified CI**: `RWA escrow static release-gate checks` workflow
`42497570695`, `RustVM escrow payout/dispute scenarios (offline)`:
**4 passed, 0 failed**. The four actual VM tests cover:
1. four independent logical gating flags plus non-attestor rejection and release-once balance;
2. unauthorized proof attempts plus deadline-based refund and zero double-pay;
3. cooling interval, forbidden seller payout with missing proofs, payer reimbursement;
4. seller-favoring dispute resolution only after complete pre-dispute proof, owner-only decision.

This is a deterministic **fresh-instance RustVM** test, not a production
MultiversX GoVM or existing-state upgrade simulation. The source's new
`openEscrow` event data ABI differs from its original draft and requires
indexer consumers to use the struct payload after any future deployment.
No real EGLD, contract upgrade, deployment or legal ownership transfer occurred.
Legacy storage readback, independent audit and attestor authority policy
remain hard blockers. **Mainnet NO-GO remains.**
