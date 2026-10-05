# Production release readiness (Phase 9.5)

## Status: **Operational readiness (Shadow-default)**

Not the same as “autonomous live trading enabled”.

| Gate | State |
|------|--------|
| Golden thread integration | PASS |
| Decision → proposal → package | OK |
| Signature bridge (copy / match) | OK |
| NFT agent lock | ABORT |
| `LIA_LIVE_TRADING` default | **0** |
| Zero-ghost compliance | ok / ghost_profit false |
| Points/ticks in wealth UI | none |
| Docker shadow stack | `docker compose up --build` |

## What “ready” means

1. CEO can generate a dust proposal and sign externally.
2. Ops can match TX hash and close the audit loop.
3. Kill-switch and compliance exist before any live session.
4. UI speaks equity / profit / supply — not points.

## What “ready” does **not** mean

- Permanent `LIA_LIVE_TRADING=1`
- Unattended broadcast
- Custodial real yield on-chain for all packs

## One-command local

```bash
docker compose up --build
```

Safe/Shadow by default (`LIA_LIVE_TRADING=0` in compose).

## First strike session (when you decide)

See `docs/FIRST_BLOOD_PROTOCOL.md` + `docs/OPERATIONAL_MANUAL.md`.
