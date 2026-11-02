# GO live health snapshot — 2026-11-02 ~20:38 CET

**Probed autonomously** (no secrets read).

## access-api — `https://xartists-access-api.onrender.com/health`

| Field | Value | Gate |
|-------|-------|------|
| ok | true | ✅ |
| paybox_configured | true | ✅ |
| paybox_mode | **prod** | ✅ armé |
| orders_backend | **postgres** | ✅ |
| packs | pulse, yield, sentinel | ✅ |
| signals_daily | true | ✅ |
| mint_dry_run | **true** | ✅ safe |
| mint_live_enabled | **false** | ✅ safe |
| mint_dispatch_enabled | **false** | ⚠️ dispatch not armed |
| lia_live_trading | **0** | ✅ |
| tro_solana_bridge | off | ✅ |
| studio_media_upload | off | ✅ |
| physical_works | off | ✅ |

### Interpretation

- **PayBox prod + Postgres** = commercial path **code+backend ready**.
- **Mint dispatch disabled** = IPN will mark paid but **will not** call GitHub Actions until `MINT_DISPATCH_ENABLED=1` + PAT.
- Recommended next env (Render dashboard, human):
  ```
  MINT_DISPATCH_ENABLED=1
  MINT_DRY_RUN=1
  MINT_LIVE_ENABLED=0
  MINT_GITHUB_PAT=<repo workflow>
  ```
- Do **not** set `MINT_LIVE_ENABLED=1` until PEM + micro/liquidity GO.

## Pages

All critical routes HTTP 200 (packs ×3, TRO sale, lia_status, daily_signal).

## Automation

Workflow: `.github/workflows/go-public-smoke.yml` (schedule 6h + dispatch).

## Still human-only

1. Render env mint dispatch arm (dry)
2. `SC_DEPLOYER_PEM` confirm
3. Buyer erd1 + optional micro mint
4. S1 real card payment
5. Whop TCA `prod_`
