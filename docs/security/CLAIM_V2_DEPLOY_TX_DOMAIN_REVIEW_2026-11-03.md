# claimPack #328 — V2 deployment-transaction domain candidate (review-only)

**Status: proposal, NOT a runtime chain-ID attestation, NOT approved, NOT deployed.**
**All existing release blockers remain active.** This is an alternative protocol proposal, not permission to issue vouchers or deploy.

## Exact gap in V1

The SC constructs `XA-CLAIM-PACK-V1\0 | len=1,T | sc_address | ...`; `T` is a compile-time intent, not a VM-observed chain ID. A second network with the same contract address and signer public key may accept the same signature.

A constructor-supplied `network_tag=T`, an external gateway response, a WASM codeHash or a node-side preimage encoder alone do not close that gap.

## Candidate: immutable, VM-sourced deployment transaction hash as V2 domain

In `init()`, capture **only** `self.blockchain().get_tx_hash()` as an immutable 32-byte `deployment_tx_hash` storage value. Do not allow an operator, owner, gateway, signer or voucher caller to pass or overwrite it. Expose a read-only getter. The existing default-paused lifecycle remains unchanged.

Define a new domain/version (do not silently reuse V1):

```text
XA-CLAIM-PACK-V2\0               17 bytes
chain_len=1, chain_intent='T'     2 bytes
deployment_tx_hash               32 bytes (from VM at init, not from caller)
sc_address                       32 bytes
signer_epoch                      4 bytes big-endian
order_hash                       32 bytes
pack_type                         1 byte
buyer                            32 bytes
amount_cents                      8 bytes big-endian
not_before                        8 bytes big-endian
expires_at                        8 bytes big-endian
catalog_version                   2 bytes big-endian
-----------------------------------------
TOTAL                           178 bytes
```

Verifier uses the *stored, VM-captured* deploy hash for every claim. A Node issuer is configured only after a human verifies testnet T, the finalized deployment transaction and the SC getter via two independent read paths; it signs exactly that anchor and the existing buyer-specific/order-specific fields. The source never falls back to V1 when a V2 signature fails.

## Why this may give cross-network replay separation

MultiversX publishes `get_tx_hash()` as a VM-accessible API and includes `chainID` in the transaction payload signed by the sender. A deployment on network `1` should therefore yield a different deployment-transaction identifier than one on network `T`, even when owner, nonce, derived SC address, code and signer public key coincide. If both `init` invocations receive their *real* respective transaction hashes, a voucher signed over one immutable anchor should not verify against the other (under hash collision resistance and uncompromised Ed25519).

**Crucial unresolved verification:** the published signing serialization does not by itself prove which exact transaction bytes the node hashes, or exactly what the VM returns in `init()`. Before accepting this proposal, check the pinned Go VM/node transaction hashing code and version, demonstrate `init().get_tx_hash()` equals the independent finalized deployment transaction hash, and prove the chainID changes the resulting identifier. No inference from a mocked hash is sufficient.

This anchors a **deployment instance**, not an intrinsic chain-ID getter. It does not defend against an adversarial VM that lies about `get_tx_hash()`, wholesale state copying, or a fork reusing the same deployment history; those are outside the proposed honest-network threat model and must be reviewed explicitly. Do not describe this as an unforgeable statement of universal runtime network identity.

## Required adversarial evidence before any approval

- [ ] Framework pin: confirm `get_tx_hash()` inside `#[init]` with `multiversx-sc=0.66.2`, including 32-byte type, nonzero value and expected semantics.
- [ ] Node/VM source pin: independent review of tx-hash construction, inclusion of chainID and actual deploy/init context.
- [ ] Whitebox tests instantiate two contracts with same SC address, buyer, signer's Ed25519 key and V2 inputs but different VM-provided deployment hashes (T/1); T succeeds under configured NFT role; 1 signature fails *before* claimed storage or mint.
- [ ] Negative control: if the mocked VM is forced to return identical deploy hashes on both copies, replay is possible. Record this to make the environmental assumption visible.
- [ ] Tests reject V1 preimages, all-zero/unset anchor, wrong signer epoch, wrong buyer, wrong catalog/price/TTL, revoked/replayed order, missing ESDTRoleNFTCreate and failed mint rollback.
- [ ] Prove immutability of stored deploy anchor, even across any permitted upgrade; ideally non-upgradeable contract and review code metadata. No owner reset/config endpoint.
- [ ] Byte-level Node/Rust golden vectors and negative signatures, ABI/build artifact checksum and on-chain BLAKE2b-256 codeHash comparison.
- [ ] Independent security signoff on this *alternative protocol* with explicit residual risks; only then a separate human-issued testnet-only authorization.

## Explicit current gates

Until the tests and independent approval above, #328 is OPEN and testnet deploy is **NO-GO**. Neither this document nor the PR permits transactions, secrets, automated issuers, mint, S1/S2 activation, PayBox/checkout, mainnet deployments or authenticity certification. Keep Render `mint_jobs` SQL evidence separate (#281).

## Primary references

- MultiversX SC API (including `get_tx_hash`): https://docs.multiversx.com/developers/developer-reference/sc-api-functions/
- MultiversX signed transaction canonical payload (including `chainID`): https://docs.multiversx.com/developers/signing-transactions/
- Existing source: `contracts/claim-pack-testnet/src/lib.rs`
- Gate: https://github.com/Neltud/xArtists/issues/328
