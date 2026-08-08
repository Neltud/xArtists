# RWA Escrow Bridge + Guardian spiral

**Status** : scaffold code on `main` · **not** deployed · Guardian enforced in Python before any intent

## Architecture (EDA)

```
TradeSettled
    → guardian_gate / sol_perps_allowed
    → EscrowIntent (amount from PnL × rwa_bucket_bps)
    → [future] mxpy openEscrow on contracts/rwa-escrow-bridge
    → delivery off-chain → release | deadline → refund
```

**Guardian before Brain** : no compound size-up, no RWA allocation from PnL, no SOL live high lev without gate.

## Modules

| Path | Role |
|------|------|
| `lia/guardian/spiral.py` | `spiral_score`, `guardian_gate`, `sol_perps_allowed` |
| `lia/guardian/test_spiral.py` | Unit tests (9) |
| `lia/rwa/bridge_events.py` | `TradeSettled` → `EscrowIntent` |
| `contracts/rwa-escrow-bridge/` | MVX SC open / release / refund / pause |

## Policy (live)

| Rule | Value |
|------|--------|
| `L_max` live micro | 1.5 |
| `S_max` spiral | 0.35 |
| SOL live lev | ≤ 1.5 (10–20× **blocked**) |
| SOL 10×+ | paper only |
| `LIA_LIVE_TRADING` | stay `0` until micro-proof |
| Deploy priority | **nft + agents market first** ; RWA bridge after |

## SC endpoints

- `openEscrow(trade_id, seller, meta_hash, deadline)` + EGLD  
- `release(id)` — payer or owner  
- `refund(id)` — after deadline or owner  
- `cancelByOwner(id)`  
- views: `getEscrow`, `getEscrowIdByTrade`  

Same security pattern as agents-marketplace: storage owner, 2-step ownership, pause, CEI.

## Tests

```bash
python -m lia.guardian.test_spiral
```

## Deploy (later — not P0 market)

```bash
# after market SC live
sc-meta all build   # in contracts/rwa-escrow-bridge
# simulate + deploy_mainnet pattern — do not point VITE until codeHash OK
```

## Treasury link

Positive PnL slice (`rwa_bucket_bps`, default 30 %) → Mission art purchases via escrow.  
See `docs/TREASURY_POLICY.md`. Not a client fund; protocol Mission bucket only when Guardian allows.
