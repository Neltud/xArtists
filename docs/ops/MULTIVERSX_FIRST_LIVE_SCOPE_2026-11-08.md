# xArtists — MultiversX-first release scope (2026-11-08)

**Decision:** finish the MultiversX EGLD/NFT product before pursuing additional chains. This is a delivery priority, not permission to turn on payments or minting.

## Release 1 — user-facing journeys (MultiversX only)

| Journey | Acceptance evidence required | Current blocker |
|---|---|---|
| Discover / connect xPortal | No-wallet browsing, connect/disconnect, chainId 1, rejected signature, mobile | UX and signer review |
| Artist studio → media → IPFS | Durable media CID, gateway retrieval, two independent replicas, recoverability | #402 |
| Mint NFT → collection / wallet | Authenticated minter, exact metadata/CID, tx hash, on-chain nonce, recipient wallet ownership | #281 #403 #407 |
| Marketplace EGLD | On-chain listing, buy/bid, seller settlement, cancellation, indexing and receipt reconciliation | #428 #431 |
| Packs | Signed settlement → one delivery → My Packs entitlement; replay and refund tested | #370 #281 |
| DAO | Read-only proposals, actual on-chain vote authorization and tally if contract exists; no mock votes shown as real | #393 |
| RWA / Vault | Legal title, quality/authenticity/receipt/beneficiary gates; escrow VM, custody and dispute tests | #430 |
| Public site | FR/EN, mobile, accessible light mode, understandable route labels and status | #393 #348 #434 |
| Admin | Wallet SDK message verification, atomic server nonce, role/multisig, audited actions | #430 |

## Deferred — do not gate release 1

Solana, Polygon, OpenSea cross-chain marketplace, token bridges, cross-chain $TRO sale, fiat checkout, automated LIA trading, and other-chain distributors. Existing routes remain accessible only as clearly labelled preview/roadmap; do not silently delete URLs.

## Strict activation gates

1. CI green for exact merge SHA; route/type/build/security tests.
2. Mainnet contract codehash + chainId 1 + signer and role proof.
3. Real end-to-end evidence for each feature before enabling its flag, with no testnet evidence passed off as mainnet.
4. Refund/dispute/replay/expiry and mobile wallet rejection cases covered.
5. No public static ZIP behind paid-plugin claims; verified entitlement only.
6. Explicit operator approval of each financial capability; never infer GO from this roadmap.

**Current disposition:** NO-GO for live checkout/mint/escrow release. Public browsing may remain available.
