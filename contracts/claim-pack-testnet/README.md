# claim-pack-testnet — isolated SC prototype, NO-GO

This is an **independent, testnet-oriented, NOT DEPLOYED** MultiversX smart
contract built with `multiversx-sc = 0.66.2`. It is not an upgrade or
replacement for the deployed agents-marketplace contract. It cannot issue a
valid claim voucher on its own: the access-api signer, SQL reservation, buyer
authentication and S2 receipt confirmation are deliberately absent.

The initial contract implementation is present in `src/lib.rs`. A dedicated
GitHub Actions workflow compiles its Rust library but does **not** build
deployment WASM, hold keys, call a network, deploy or run a buyer payment.

## Entry points

| Endpoint | Rule |
| --- | --- |
| `registerClaimSigner` | owner only, while paused; immutable epoch/public key |
| `disableClaimSigner` | owner only; permanent disable, auto-pause if active |
| `configurePackCollection` | owner only, while paused; one-way binding |
| `pauseClaims` / `unpauseClaims` | owner only, initial state paused |
| `revokeOrderHash` | owner only, before claimed |
| `claimPack` | caller-bound testnet Ed25519 preimage, single-use, mint + transfer |

Signature preimage matches
`services/access-api/src/claimVoucherCodec.mjs`:
`XA-CLAIM-PACK-V1\0 | 01 | 54 ('T') | sc[32] | epoch(u32be) |
order_hash[32] | pack(u8) | buyer[32] | eur_cents(u64be) |
not_before(u64be) | expires(u64be) | catalog(u16be)` (146 bytes).

Fiat catalogue: Pulse 11000, Yield 7500, Sentinel 5000 cents, immutable
inside the prototype. No `setPackPrice` call and no EGLD micro-pricing.

## Explicit blockers (NOT testnet GO)

1. **Runtime network identity:** this isolated implementation uses a
   *literal testnet signing domain* `T`, but has not independently verified
   the running network ID from the VM. A contract mistakenly deployed at a
   colliding address on another network could conceivably validate a testnet
   signature. Before any deployment, establish a trusted runtime chain-ID
   check or equivalent rigorous proof, and ban mainnet deployment of this
   artifact using independent operations controls.
2. **Real 8-case execution:** on-chain/scenario tests of valid mint+transfer,
   duplicate claim, wrong buyer, expiry/future, signature/epoch,
   wrong EUR amount, revoke, and paused state have **not yet passed**.
   Include rollback when collection lacks `ESDTRoleNFTCreate`, gas exhaustion,
   and cross-shard delivery/recovery; CI compilation alone cannot prove them.
3. **ESDT collection and role:** no collection is configured or role granted.
   NFT creation is attempted only with a configured collection. Mint failure
   must roll back `claimed` in the chain VM, to be tested.
4. **Signer governance:** no claim-only private key exists in this crate.
   Signer epochs are sealed and disabled epochs never re-enable. A future
   trusted signer service must never share deployer wallet keys.
5. **Payment/accounting:** no issuer, PayBox callback, atomic SQL
   reservation, chargeback processing, S2 receipt, `mint_jobs` delivery write,
   wallet connection or checkout is exposed. Operator database probe #281
   remains outstanding.
6. **Deployment/review:** static analysis, code audit, independent
   MultiversX review and human GO required before a **testnet** deployment.
   Mainnet, public checkout, LIA live trading and $TRO bridge remain NO-GO.

See `docs/security/CLAIM_PACK_TESTNET_SPEC_2026-11-03.md` and
`docs/security/claim-voucher-b-a-2026-11-03.md`.
