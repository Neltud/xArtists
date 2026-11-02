# Live mainnet — operator runbook (mainstream sprint)

**Date:** 2026-11-02  
**PR hardening:** #258 merged  
**LIA trading:** remains **OFF** (`VITE_LIA_LIVE_TRADING=0` / `LIA_LIVE_TRADING≠1`)

## On-chain snapshot (re-check before GO)

| Wallet | EGLD |
|--------|------|
| Deployer `erd1kex0…vl8v0g` | ~0.005 |
| Admin | ~0.14 |
| LIA | ~0.91 |

| Pack | SC price | Rule1 |
|------|----------|-------|
| Pulse | 1 EGLD | 33 |
| Yield | 5 | 22.5 |
| Sentinel | 2.5 | 15 |

→ Catalogue Rule1 needs **top-up deployer**.  
→ **micro_price=true** viable for first live proofs (~0.001 + gas).

## Gates (all required for live chain mint)

### A — GitHub Actions (manual or dispatch)
1. Environment **production** secret `SC_DEPLOYER_PEM` present
2. Workflow **Mint on payment**
3. Inputs:
   - `live_mint=true`
   - `confirm=LIVE_MINT_MAINNET`
   - `micro_price=true` (until funded)
   - `buyer=erd1…` validated
   - `pack=sentinel|pulse|yield`
   - `order_id=` optional correlation

### B — access-api env (auto IPN path)
```
MINT_DISPATCH_ENABLED=1
MINT_GITHUB_PAT=<pat workflow>
MINT_DRY_RUN=0
MINT_LIVE_ENABLED=1
MINT_MAINNET_CONFIRM=LIVE_MINT_MAINNET
MINT_MICRO_PRICE=true
DATABASE_URL=<postgres>   # multi-instance idempotency
```

Default without these: **dry_run only** (safe).

### C — Human checklist
- [ ] PEM confirmed in UI (never paste in chat)
- [ ] Buyer `erd1` signed off
- [ ] Deployer balance ≥ 0.004 (micro) or ≥ 20 (Rule1 Sentinel)
- [ ] One pack only for first live
- [ ] Explorer verify NFT on buyer after run
- [ ] SC prices restored to Rule1 after micro

## Flow

```
Paybox IPN (RSA ok)
  → applyIpn → server_confirmed
  → triggerMintDispatchSafe
  → Actions mint-on-payment
  → (if live) setPackPrice → buyPack → restore Rule1 → transfer NEW nft
```

GitHub **204** = dispatch accepted ≠ mint confirmed.

## Commercial

- Packs = one-time + NFT rights
- Whop TCA = services only (no Genesis)
- No commercial GO until real payment + My Packs NFT proof if product policy requires it

## Rollback

```
MINT_LIVE_ENABLED=0
MINT_DRY_RUN=1
MINT_DISPATCH_ENABLED=0
```
Manually `getPackPrice` / `setPackPrice` Rule1 if stuck micro.
