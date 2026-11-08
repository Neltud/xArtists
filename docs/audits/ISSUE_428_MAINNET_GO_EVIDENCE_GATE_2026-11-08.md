# Issue #428 — mainnet marketplace GO evidence gate (NO-GO)

Scope: EGLD NFT listing, buy, bid, settlement, wallet signers, and distributor. This checklist is an **audit artifact**, not proof that any mainnet action succeeded.

## Mandatory evidence (all independently verified)

| Gate | Required artifact | Failure handling |
|---|---|---|
| Network | Contract address, chain ID, deployed code hash and explorer evidence | Block all live UI calls |
| Signer | Explicit wallet authorization and scoped message/transaction; never collect private keys | Reject and log |
| Listing | Token ID/nonce, owner, seller authorization, price/currency, expiry, signed listing ID | Reject stale or conflicting listings |
| Purchase | Escrow/funds secured, signed buyer intent, final transaction receipt | Do not mark paid on initiation |
| Bids | Bid lock, expiry, cancellation, replay prevention, outbid refunds | Block settlement |
| Settlement | Atomic or recoverable funds/NFT transfer, actual NFT owner after finality | Mark pending, reconcile |
| Distributor | Verified contract role, stock, supply, price, one-mint-per-authorized-request | Disable live mint |
| Failure paths | Disputes, refunds, retries, duplicate callbacks, reorg/finality, multi-worker race | Fail closed |
| Public UX | No false LIVE, no misleading ownership/delivery status | Hide live actions |
| RWA | Separate fiat PSP escrow, physical receipt, authenticity, quality, title, NFT custody beneficiary | No seller release |

## Execution order

1. Read-only chain verification: contract addresses, deployed code hashes, roles and signer capabilities.
2. Local/unit tests with adversarial duplicate purchase/bid/settlement cases.
3. Testnet end-to-end with receipts and actual owner reconciliation.
4. Independent security and legal/PSP review for real-money escrow.
5. Mainnet dry-run plan and explicit transaction-specific owner authorization.

## Non-negotiable policy

- NFT digital mint requires authorized Web3 wallet signing; no fiat-triggered mint.
- RWA physical purchases may use fiat and xArtists custodial vault with explicit consent for users without a personal wallet.
- Custody, beneficial ownership, and legal title are distinct; no release until documentary and chain/vault evidence reconcile.
- No mainnet launch, transfer, deployment, mint or payment is authorized by this document.

## Status

No testnet/mainnet receipts, contract code hashes, signer proofs or settlement evidence were independently validated in this audit. **NO-GO** until the above artifacts are supplied and reviewed.
