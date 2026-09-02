---
name: lia-pipeline-cycle
description: Run the canonical LIA Vellum data + paper trading cycle on MultiversX mainnet.
---

# LIA pipeline cycle

## When to use

- Cadence 1–15 min (Vellum timer / cron)
- After code push that touches board, oracles, or status JSON

## Preconditions

```bash
export LIA_LIVE_TRADING=0
export CHAIN=1
export PYTHONPATH=.
```

Never set `LIA_LIVE_TRADING=1` from this skill.

## Steps

1. `python -m lia.vellum.pipeline`
2. Confirm `data/vellum_last_run.json` exists and `steps` show bootstrap/oracles/agent/guardian
3. Optional mirror already done by pipeline — if Pages empty, run `python -m lia.vellum.publish_data_for_frontend`
4. Optional board-only: `./scripts/vellum_board_cadence.sh`

## Success criteria

- `guardian` key present in last run
- `LIA_LIVE_TRADING` reported as 0 / skipped live
- No PEM paths in logs

## Failure

- chain != 1 → abort (mainnet only)
- oracle failure → continue soft but note in steps
