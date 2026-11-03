# GO LIVE (safe) — 2026-11-03

**Operator intent:** mainstream public surfaces **ON**.  
**Hard NO:** non-atomic mainnet mint (#310), open checkout without S1 playbook, LIA trading, Solana bridge.

## What is LIVE now (measured)

| Surface | Status |
|---------|--------|
| GitHub Pages dApp | **LIVE** |
| Packs / Museum / Command / TRO discovery | **LIVE** (read) |
| LIA signals / lia_status paper | **LIVE** |
| access-api Render | **LIVE** |
| PayBox **credentials** prod | **LIVE** (configured) |
| PayBox **checkout session** | **OFF** (`paybox_checkout_enabled=false`) |
| OIDC mint **dry-run pull** | **ON** |
| Manual/auto **live mint** | **OFF** (#310 hard deny) |
| LIA trading | **OFF** |
| TRO Solana bridge | **OFF** |

## What “GO LIVE” does **not** mean

- Not “card payment open to the public” until `PAYBOX_CHECKOUT_ENABLED=1` **and** refund + support staffing.
- Not “NFT on payment” — paid ≠ delivered (#282).
- Not “deployer funded ⇒ mint” — live workflow refuses non-atomic path.

## Enable checkout later (separate GO)

```env
PAYBOX_CHECKOUT_ENABLED=1
# keep:
MINT_LIVE_ENABLED=0
MINT_DRY_RUN=1
MINT_OIDC_PULL_ENABLED=1   # optional dry claim after paid
LIA_LIVE_TRADING≠1
```

Before that: support channel + refund runbook (`docs/REFUND_PACKS.md`) + honest UI copy.

## Mint mainnet later (separate engineering GO)

Requires **atomic** pack purchase (no admin `setPackPrice` window) **or** explicit written acceptance of residual risk + funded deployer + re-enable path under new PR (not a silent revert of #310).

## Public copy (allowed)

- “xArtists packs and LIA signals are live on the dApp.”
- “PayBox integration is production-ready; checkout opens on operator GO.”
- “Mint delivery is gated; payment never auto-delivers NFT.”

## Public copy (forbidden)

- “Buy and receive your NFT instantly.”
- “Live on-chain mint enabled for all buyers.”
- “LIA trades for you.”
