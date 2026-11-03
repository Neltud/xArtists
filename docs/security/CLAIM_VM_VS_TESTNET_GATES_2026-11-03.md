# claimPack — VM simulation vs public testnet GO

**Date:** 2026-11-03  
**main tip at writing:** includes `contracts/claim-pack-testnet/` + xArt-ID pHash (#326).

## What is proven (VM / CI)

| Evidence | Meaning |
|----------|---------|
| Isolated SC under `contracts/claim-pack-testnet/` | Not an upgrade of live agents-marketplace |
| Ed25519 preimage aligned with `claimVoucherCodec.mjs` | Domain + 146-byte layout |
| Local MultiversX scenario tests (reported 12/12) | Happy path, replay, wrong buyer, bad sig, expiry, revoke, pause, wrong SC binding, non-owner admin, NFTCreate role missing → claim mark rolled back |
| Render deploy of **source** | Code present in repo services; **not** a chain deployment |

## What is NOT proven

1. Public **testnet** deployment address + explorer tx  
2. Runtime **chain-id** binding against live network (README residual risk)  
3. Gas profile / cross-shard delivery  
4. access-api **issuer** (SQL reservation + claim-only vault key + HTTP)  
5. PayBox S1 real IPN + S2 independent NFT receipt  
6. `mint_jobs` presence on the **Render-bound** Postgres (operator SQL still open on #281)

## Gate language (shared ChatGPT + Grok)

| Phrase | Allowed when |
|--------|----------------|
| "VM matrix green" | Local scenario tests pass |
| "testnet GO" | Deployed on MultiversX **testnet**, chain-id checked, 8+ cases on-chain, roles bound |
| "commercial GO" | S1+S2+refund+issuer+human GO — **still NO-GO** |

Never market VM success as mainnet delivery or automatic certification.

## Parallel tracks

| Track | Owner | Next |
|-------|-------|------|
| claimPack public testnet | ChatGPT lead SC | Deploy testnet + chain-id + gas |
| Issuer / mint_jobs | ops + ChatGPT | SQL probe + vault key later |
| xArt-ID decode JPG/PNG | either | Secure decode + calibration on consented works (#324) |
| Maison / auction UX | Grok | PR #320 hub; auction remains flag-off |

## NO-GO list (unchanged)

PayBox public checkout · mainnet mint · claim HTTP issuer · LIA live trading · TRO Solana bridge · automatic authenticity certificates from pHash alone.
