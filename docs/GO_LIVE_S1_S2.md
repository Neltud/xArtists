# GO Live — S1/S2 evidence ladder (updated 2026-11-03)

> **Supersedes** the 2026-11-02 “live mint armed by default” wording.  
> Current production is **fail-closed**: dry-run OIDC only, checkout gated, no auto NFT delivery.

## Measured Render `/health` (2026-11-03 ~12:43 CET)

| Flag | Value |
|------|--------|
| paybox_mode | prod |
| paybox_checkout_enabled | **false** |
| mint_oidc_pull_enabled | **true** |
| mint_dispatch_enabled | **false** (no PAT) |
| mint_dry_run | **true** |
| mint_live_enabled | **false** |
| mint_micro_price | **false** |
| lia_live_trading | **0** |
| tro_solana_bridge | off |

## Definitions

| Gate | Meaning |
|------|---------|
| **S1** | Authentic PayBox payment · RSA IPN · `server_confirmed` · amount match · durable order row |
| **S2** | Independent mainnet NFT receipt · buyer balance · correlated mint job · **not** implied by S1 |

Payment **never** implies NFT delivery (`#282`).

## Dispatch path (current)

1. **OIDC pull** (preferred): GitHub Actions → `POST /v1/ops/mint-oidc-pull` with verified OIDC. Claims order in `mint_jobs`, then workflow_dispatch **dry-run only** (`live_mint=false`, `confirm=DRY_RUN`). See `docs/MINT_OIDC_DISPATCH.md`.
2. **Legacy PAT push**: disabled in prod (`mint_dispatch_enabled=false`). Do not reintroduce long-lived PAT.

## Live mainnet mint (human only)

Still **NO-GO auto**. Manual workflow only if:

- `SC_DEPLOYER_PEM` present on environment **production**
- deployer funded (Rule1) **or** explicit micro path accepted as residual risk
- inputs: `live_mint=true` · `confirm=LIVE_MINT_MAINNET` · buyer `erd1`
- micro_price remains **blocked** by code when live (`live_blocked_non_atomic_micro_price`) unless policy changes

Deployer observed ~**0.005 EGLD** → catalogue Rule1 not fundable without top-up.

## LIA / bridge

- LIA: signals paper only · `LIA_LIVE_TRADING=0`
- Solana TRO bridge: **disabled**
- TCA Whop: services only · **no** Genesis mint

## Marketing language

Allowed: “PayBox integrated”, “dry-run mint path tested”, “OIDC auth proven”.  
Forbidden until S1+S2 on a real order: “NFT delivered on payment”, “live mint automatic”.
