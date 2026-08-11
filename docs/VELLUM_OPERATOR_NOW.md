# Vellum Operator — run NOW

**CHAIN=1 · LIA_LIVE_TRADING=0 · PEM secrets only.**

## One-shot (paper + publish frontend)

```bash
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
```

Cadence Timer : **3–5 min**.

Writes: `lia_v6_status.json` (kill_state for Commander), mirrors `public/data`, `vellum_production_run.json`.

## Deploy SC (opt-in)

```bash
export PEM=/secrets/mainnet.pem FEE_BPS=300
# Prefer explicit scripts; or:
export VELLUM_DEPLOY_SCS=1
python -m lia.vellum.production_run
```

## Nouveautés

| Module | Vellum |
|--------|--------|
| Guardian + death-spiral | pipeline step guardian |
| Kill reset | **manual ops only** |
| Commander UI | status.orchestrator.guardian.kill_state |
| Splitter 40/30/20/10 | after Mission/Reserve wallets |
| Board/status 404 | production_run mirror |

## Interdits

- No LIVE without micro-proofs
- No bandeau removal without codeHash
- No auto kill-reset
- No PEM in git
