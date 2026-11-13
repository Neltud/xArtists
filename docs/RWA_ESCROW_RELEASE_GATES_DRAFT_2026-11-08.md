# RWA escrow release gates — draft, NO-GO

This patch prevents direct EGLD release by either `confirmReceipt` or `submitVerificationProof` alone. The attestor must submit an ownership reassignment attestation, then explicitly call `release`. The payer confirms receipt. The attestor submits separate authenticity and physical quality proofs. Any dispute blocks the normal release.

## Critical limitations

- **Breaking storage layout / ABI change:** `Escrow` has new fields. DO NOT upgrade any existing deployed contract in place. Migration, compatibility review and fresh test deployment are required.
- **Trusted attestor:** the contract checks caller and hashes, not the real-world truth of documents, delivery, quality, title, or vault beneficiary reassignment. Independent evidence validation and durable audit records must be implemented off-chain before production.
- **EGLD only:** this contract does not hold fiat, NFT custody or execute legal title transfer. Fiat escrow needs a licensed PSP and its own release gate.
- **No automatic mint:** fiat payment cannot trigger NFT mint. For RWA without a personal wallet, a separately authorized xArtists wallet can certify the work, with explicit custody consent and documented beneficiary rights.
- **Owner refund and dispute resolution:** existing owner authority remains powerful. Multisig, authorization policy and external security audit are required.

## Required tests before review/merge

1. Receipt alone does not release; verification alone does not release; ownership attestation alone does not release.
2. Each pair of conditions does not release; all three plus authorized attestor release exactly once.
3. Non-attestor cannot attest or release; payer cannot release.
4. Dispute before release blocks release; refund/cancel blocks release; replay fails.
5. Invalid or empty hashes fail; escrow IDs remain isolated.
6. Test storage migration, ABI compatibility, reentrancy, insolvency, and property-based state invariants.
7. End-to-end mock of fiat PSP escrow + legal transfer + vault ledger + NFT beneficiary reconciliation, including partial failures.

**Status:** code proposal only; tests not executed; no deployment, payment, mint or merge authorized.

## Static regression suite

`node --test contracts/rwa-escrow-bridge/tests/release_gates.static.test.mjs`

This suite checks source-level invariants only. It does **not** compile Rust, execute on a MultiversX VM, validate evidence, or establish security. Real scenario tests and a migration plan remain mandatory.
