# S2 — MultiversX mainnet NFT/SFT receipt attestation (read-only)

**Prepared:** 3 November 2026. **Status:** offline fixture verified only until the PR CI passes. No buyer payment, on-chain mint, transfer, NFT delivery or commercial GO is claimed here.

## Purpose

A PayBox IPN marked `paid` is only a **payment signal**, not a delivered NFT. GitHub Actions HTTP 204 means only that dispatch was accepted. `/health` and PostgreSQL readiness do not independently attest fulfilment.

`services/access-api/src/mvxReceiptVerifier.mjs` provides a **GET-only S2 candidate verifier**. Given a trusted operator-supplied tx hash, collection identifier, issuer, buyer wallet and NFT nonce, it checks:

1. Exact 64-character transaction hash, MultiversX Bech32 checksum on both addresses, expected NFT collection, positive nonce/quantity.
2. `GET https://gateway.multiversx.com/transaction/{hash}?withResults=true`: transaction present, executed and hash consistent.
3. `GET https://gateway.multiversx.com/transaction/{hash}/process-status`: **success** status.
4. Exactly **one** matching `ESDTNFTTransfer` event: decoded base64 topics encode expected collection, nonce, amount and actual raw 32-byte buyer address; event sender equals the independently trusted issuer.
5. `GET https://gateway.multiversx.com/address/{buyer}/nft/{collection}/nonce/{nonce}`: buyer currently owns at least the specified quantity.

A negative, unavailable, ambiguous or malformed response **fails closed**. Multiple events, mixed collections, incorrect recipient, inconsistent token balance and pending tx do not count as a verified delivery. This checker does not handle multi-transfer event batching or cross-chain receipts; unsupported shapes require further implementation and security review.

## Restricted use and limits

The call is available only as a library, **not a new public API endpoint or automatic order-state mutation**. It does not update `paybox_orders`, `mint_jobs`, `delivered_at`, `delivery_verified` or `server_confirmed`. It never sends transactions, accesses a wallet secret or queries a customer's PayBox order.

The caller must obtain expected `issuer`, `collection`, `buyer`, `nonce` and `txHash` from a **trusted reconciled order/operator**, not from an unauthenticated customer request. Verification of current ownership is a point-in-time check; later resale/transfer can change a balance, so this is not a permanent historical custody proof.

**Still necessary before any commercial GO:**

- S1: a truly signed PSP callback from the authorized PayBox environment and transaction-to-order ledger reconciliation.
- Unique mapping of a PSP transaction ID, order ID and *one* verified chain tx hash in a durable PostgreSQL transaction; idempotence, concurrent worker race tests and anti-replay.
- Finality/chain reorganization policy, independent supply, issuer and collection review, authentic artist approval, and operator reconciliation evidence.
- A secure delivery-state transition based on that reconciled proof, plus a separate refund/revocation policy. Never call `markMintJobConfirmed` solely on a successful GitHub dispatch.
- Explicit sign-off for a real test wallet and merchant before any mint, PayBox checkout, or live flag.

## Safe test

```bash
cd services/access-api
npm ci --ignore-scripts
node --test tests/mvxReceiptVerifier.test.mjs
```

All test values are synthetic and all external GETs are mocked: **no mainnet RPC is called in CI**.

References: [MultiversX transaction and process-status gateway API](https://docs.multiversx.com/sdk-and-tools/rest-api/transactions/), [ESDT NFT transfer events (topic definitions)](https://docs.multiversx.com/developers/event-logs/esdt-events/), [NFT holder query](https://docs.multiversx.com/tokens/nft-tokens/), and [xArtists P0 issue #281](https://github.com/Neltud/xArtists/issues/281).
