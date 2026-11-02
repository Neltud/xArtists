# Sprint GO — Operator checklist (2026-11-02)

**Release on main:** 0.129.1 · tip `eee78a85`  
**LIA trading:** OFF · **Mint live:** OFF until explicit GO

## A. Public surfaces (automated / browser)

- [x] `https://neltud.github.io/xArtists/` → 200
- [x] `/packs/pulse|yield|sentinel/` → 200
- [x] `/tro/sale/` → 200
- [x] `/data/lia_status.json` → `paper:true`, `LIA_LIVE_TRADING:0`
- [x] `/data/signals/daily_signal.json` → 200

## B. access-api production (you)

Set / confirm:

```env
MINT_DISPATCH_ENABLED=1
MINT_DRY_RUN=1
MINT_LIVE_ENABLED=0
# LIA_LIVE_TRADING must NOT be 1
DATABASE_URL=<postgres>   # recommended
MINT_GITHUB_PAT=<workflow scope>  # if dispatch armed
PAYBOX_IPN_URL=https://...
```

`GET /health` must show:

| Field | Expected |
|-------|----------|
| `ok` | true |
| `mint_dry_run` | **true** |
| `mint_live_enabled` | **false** |
| `lia_live_trading` | `"0"` |
| `signals_daily` | true |
| `tro_solana_bridge` | `off` |
| `studio_media_upload` | `off` (unless Pinata GO) |
| `physical_works` | `off` (unless Shopify GO) |

Paste `/health` JSON in ops channel before any live mint.

## C. First mainnet mint (optional, human)

Only after B:

1. `SC_DEPLOYER_PEM` present on environment **production** (UI only)
2. Buyer `erd1…`
3. Workflow **Mint on payment**:
   - pack=`sentinel`
   - `live_mint=true`
   - `confirm=LIVE_MINT_MAINNET`
   - `micro_price=true` (deployer ~0.005 EGLD)
4. Explorer: NFT on buyer · SC prices restored toward Rule1

## D. Commercial packs

- [ ] **S1** real PayBox payment (Sentinel 50€)
- [ ] **S2** My Packs shows NFT
- [ ] Whop TCA `prod_` (services only, no Genesis SFT)

## E. Explicit non-goals

- LIA live trading
- Solana TRO bridge enable
- Studio Pinata / Physical Shopify without separate GO
- Catalogue Rule1 mint without deployer top-up

## Decision log

| Date | Decision |
|------|----------|
| 2026-11-02 20:35 CET | Pages + signals GO · commercial NO-GO · mint dry only |
