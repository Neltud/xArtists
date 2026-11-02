# Sprint GO — Operator checklist (updated 2026-11-02 20:38 CET)

**Release:** 0.129.1  
**API:** https://xartists-access-api.onrender.com

## A. Public surfaces — DONE (probed)

- [x] Pages home + 3 packs + TRO sale → 200
- [x] `lia_status.json` paper · LIA_LIVE_TRADING 0
- [x] daily signal 200
- [x] API `/health` 200
- [x] API signals / TRO bridge status / physical+studio config

## B. access-api — measured

| Flag | Measured | Target dry GO |
|------|----------|---------------|
| paybox_mode | **prod** | prod |
| orders_backend | postgres | postgres |
| mint_dry_run | true | true |
| mint_live_enabled | false | false |
| mint_dispatch_enabled | **false** | **true** (next) |
| lia_live_trading | 0 | 0 |

### Next Render env (you — 1 minute)

```
MINT_DISPATCH_ENABLED=1
MINT_DRY_RUN=1
MINT_LIVE_ENABLED=0
MINT_GITHUB_PAT=<PAT workflow>
```

Then re-hit `/health` until `mint_dispatch_enabled: true`.

## C. First mainnet mint (human)

Deployer ~0.005 EGLD → **micro_price=true** only.

1. PEM on environment production
2. buyer erd1
3. Actions: pack=sentinel · live_mint=true · confirm=LIVE_MINT_MAINNET · micro_price=true

## D. Commercial

- [ ] S1 PayBox real (Sentinel)
- [ ] S2 My Packs NFT
- [ ] Whop TCA prod_

## E. Non-goals

LIA trade · Solana bridge · Studio/Physical prod without separate GO
