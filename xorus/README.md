# xOrus backend (paper only)

Canonical intelligence backend for xArtists. **Replaces LIA / Vellum execution.**

## Contract

| Flag | Value |
|------|--------|
| `executable` | `false` |
| `live_trading` | `false` |
| `sentinel_veto` | `true` |
| ChatGPT weight | ≤ 15 % |
| Defined signals | 120 (catalog) |

No mint, sign, trade, or payment authorization from this package.

## Commands

```bash
export PYTHONPATH=.
python -m xorus                    # one board → stdout
python -m xorus.production_run     # board + data/ + public mirror
```

## Migration from LIA

| Legacy | Replacement |
|--------|-------------|
| `python -m lia.vellum.production_run` | `python -m xorus.production_run` |
| `python -m lia.xorus` | `python -m xorus` |
| `LIA_LIVE_TRADING` | **forbidden** (hard error if set to 1) |
| `lia/` trading / vellum cycles | **retired** — see `docs/ops/LIA_PURGE_XORUS_BACKEND.md` |

Daily dual reports (Grok + ChatGPT) remain in `services/signals-worker/` and the `daily-signals` workflow.
