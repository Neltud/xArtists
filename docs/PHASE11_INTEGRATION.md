# Phase 11 — Full-stack integration

## Closed loops

| Loop | Path |
|------|------|
| RWA sold+shipped → TRO burn ledger | `fulfillment --ship` → `record_burn` + audit |
| RWA reassess → pack equity | `integration_pulse` / `performance_tracker` |
| Zero-ghost | `reconciliation_audit` (ceiling = inception+trading+RWA-attr) |
| UI wealth | `PortfolioWealth` packs + RWA + feed + integrity |
| Engine status | `LiveExecutionFeed` Idle/Trading/Error |

## Commands

```bash
PYTHONPATH=. python -m lia.genesis.integration_pulse
PYTHONPATH=. python -m lia.utils.reconciliation_audit
PYTHONPATH=. python -m lia.utils.reconciliation_audit --halt-on-fail
```

## Docker

```bash
docker compose up --build
```

Live/autonomous flags stay **0** in compose. PEM never in image.

## Honest limits

- TRO burn on-chain still HITL (Burnify TX) — ledger is authoritative until then
- Reconciliation is attribution-aware, not a full balance-sheet identity to catalog MV
