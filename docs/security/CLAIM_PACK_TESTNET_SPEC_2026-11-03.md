# claimPack MultiversX testnet — phase 1 spec (2026-11-03)

**Status:** design only. No SC deploy, no claim-only private key in CI, no mainnet, no PayBox checkout.

**Base:** main `@750e1157` after merge of #312 + #318 (codec V1, eligibility, revoke, compose, TTL ≤ 15 min).

## Goal

Prove on **MultiversX testnet** that a buyer can redeem a server-issued Ed25519 voucher into **exactly one** NFT in a single atomic SC transaction, with:

| Property | Requirement |
|----------|-------------|
| Single-use | `claimed[order_hash]` permanent map |
| Caller | `msg.sender == buyer` (V1 no relayer) |
| Time | `block.timestamp ∈ [not_before, expires_at]` and TTL ≤ 15 min at issuance |
| Signature | Ed25519 over canonical `claimVoucherCodec` bytes; epoch + pubkey registered on SC |
| Delivery | mint/transfer NFT to buyer in **same** tx; failure rolls back claim mark |
| Revocation | owner/guardian `revokeOrderHash` before claim; after claim refund is ops+off-chain only |
| Pause | `pauseClaims` independent of marketplace `paused` if needed |

## Non-goals (this phase)

- Do not call `setPackPrice` for fiat path
- Do not use deployer PEM as claim signer
- Do not enable `PAYBOX_CHECKOUT` or mainnet live mint workflows
- Do not trust client JSON as payment proof

## Suggested SC surface (Rust / mx-sdk)

```text
#[endpoint(registerClaimSigner)]   // owner: epoch + 32B ed25519 pubkey
#[endpoint(revokeOrderHash)]       // owner/guardian: mark order_hash revoked
#[endpoint(pauseClaims)] / unpauseClaims
#[endpoint(claimPack)]             // buyer: pack_type, order_hash, amount_cents,
                                   // not_before, expires_at, catalog_version,
                                   // signer_epoch, signature (64B)
```

`claimPack` verification order:

1. not paused / claims not paused  
2. pack collection configured  
3. amount_cents matches frozen catalogue for pack_type  
4. now in [not_before, expires_at]  
5. order_hash not claimed and not revoked  
6. reconstruct message with domain `XA-CLAIM-PACK-V1\0` + fields (same as Node codec)  
7. `ed25519_verify(pubkey[epoch], message, signature)`  
8. mark claimed **then** mint/transfer NFT to `msg.sender`  

If step 8 fails, entire tx reverts (including mark).

## Test matrix (testnet)

1. Happy path: valid voucher → NFT to buyer, second claim same order_hash fails  
2. Wrong buyer wallet  
3. Expired / not_before in future  
4. Bad signature / wrong epoch  
5. Amount ≠ catalogue  
6. Revoked order_hash  
7. PauseClaims  
8. Replay after successful claim  

Share **hex golden vectors** between Node (`claimVoucherCodec.mjs`) and Rust unit tests before any deploy.

## Issuer (access-api) — still later

Only after testnet matrix green:

1. Atomic SQL reservation (order_id + provider_tx_id + order_hash unique)  
2. Sign with vault claim-only key (never GITHUB Actions logs)  
3. Buyer JWT/SIWX to fetch voucher  
4. Independent S2 receipt before `delivery_verified`  

## Ops residual (#281)

```sql
SELECT to_regclass('public.mint_jobs');
```

on the **Render-bound** database remains operator-only.

## Decision

**GO** testnet SC design + offline vectors.  
**NO-GO** commercial checkout, mainnet claim, LIA live, TRO bridge.

## Preflight invariants (strict V1)

- Testnet/mainnet replay prevention: signed payload binds literal chain ID and this 32-byte SC address, signer epoch, caller buyer bytes, and order hash. No JSON serialization.
- The SC checks `expires_at > not_before` and `expires_at - not_before <= 900` seconds. Server compose defaults to 600s, max 900s.
- Signer registry rejects unconfigured/zero epochs and malformed 32-byte public keys; rotation must not reauthorize revoked claims.
- The minting SC must hold the **ESDTRoleNFTCreate** local role for the configured collection on the chosen network.
- A signature proves authorization by the signing key, NOT PayBox payment, legal ownership, or physical art authenticity.
- Mint and transfer must be atomic with the claimed flag; failure must revert the entire transaction. Test missing NFT create role and insufficient gas.
- The legacy `setPackPrice` endpoint must never participate in the fiat path.

References: [NFT roles](https://docs.multiversx.com/tokens/nft-tokens/) and [SC functions](https://docs.multiversx.com/developers/developer-reference/sc-api-functions/).


## Cross-language offline parity implemented

`tests/rust/claim_voucher_v1_vectors.rs` now reconstructs the 146-byte
binary voucher for the same **fictitious** fields used by
`services/access-api/tests/claimVoucherCodec.test.mjs` and asserts
byte-for-byte equality with the canonical hex vector. It tests wrong
network, signer epoch, buyer, contract, order hash, exact EUR catalogue,
version and expiry. `.github/workflows/claim-voucher-vector-parity.yml`
runs Node's real SHA256/Ed25519 tests plus this standalone Rust framing test.

**Important limitation:** Rust currently reuses the Node fixture's 32-byte
order hash, rather than implementing an independent Rust SHA-256 routine.
These checks validate layout and lengths, **not** a deployed SC's signature
verification, order-hash calculation or claim/mint behavior. The eight-case
on-chain matrix and independently computed SC hash must still be implemented
before testnet approval. No keys, real vouchers, SC deployment or NFT
transactions are performed by this parity workflow.
