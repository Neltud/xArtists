# Mainnet truth re-probe — 2026-11-08

**Scope:** configuration truth only. **Not** a commercial go-live.

## Verified

| Check | Result |
|-------|--------|
| 10 product SC codeHashes | Match registry (10/10) |
| `agents_marketplace.isPayable` | **false** → transferts directs bloqués, **pas nécessairement l'endpoint payable** |
| `nft_marketplace.isPayable` | **true** · 1 NFT held (`ASFT-a6273a-01`) |
| `slot_casino.isPayable` | **false** (by design) |
| `rwa-escrow-bridge` | **Not registered** |
| Pulse `XAIPLS-2cf72b` | Nonces 1–4 · URI empty · **#005 absent** |
| LIA ops wallet | ~0.0053 EGLD · nonce 117 |
| App gates | LIA trading OFF · mint live OFF · Studio OFF · Paybox checkout OFF |

## Label policy

- `SC_DEPLOYED_HASH_OK` = address exists and codeHash matches.
- **Not** the same as `COMMERCE_ENABLED`.

## Explicit non-actions

- No SC property change (payable).
- No mint, upgrade broadcast, or role grant.
- No merge of PR #407 / #430 as live.
- No enabling of Render mint/checkout flags.

## Next owner-gated steps (optional, sequential)

1. Do **not** upgrade merely to set payable metadata: the flag applies to direct transfers, not endpoint payments (MultiversX official docs). Review the endpoint instead.
2. IPFS + URI roles before pack media claims.
3. Pulse #005 only after CID proofs (#407).
4. RWA only as fresh audited deploy (#430).

## Correction 2026-11-08 : flag Payable

The prior inference `isPayable=false => buyPack EGLD impossible` was incorrect. Per https://docs.multiversx.com/developers/developer-reference/sc-payments/, code metadata `isPayable` controls **direct contract transfers**, whereas endpoint payments are governed by `#[payable]`. The commercial NO-GO still stands for empty NFT URIs, unverified media and quote inconsistency. Do not sign an unnecessary payable-only upgrade.
