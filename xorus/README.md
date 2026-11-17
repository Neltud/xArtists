# xOrus backend (paper only) — v0.2

Canonical intelligence backend. **LIA / Vellum execution path retired.**

## Modules

| Module | Role |
|--------|------|
| `catalog.py` | 120 defined signals (12×10) |
| `paper_engine.py` | scorer + crosscut (ex-Chorus, LIA-free) |
| `swarm.py` | `run_xorus()` public API |
| `analysis_cycle.py` | Binance public klines → report |
| `analysis_report.py` | sealed analysis document |
| `decision_agent.py` | bounded advisory board |
| `data_feed.py` | proof-bound signal counts |
| `preprod_gate.py` | preflight gates |
| `production_run.py` | operator cycle + data mirror |
| `safety.py` | immutable `executable=false` contract |

## Commands

```bash
export PYTHONPATH=.
python -m xorus
python -m xorus.production_run
```

## Safety

- `LIA_LIVE_TRADING=1` → refused in `production_run`
- Sentinel veto, ChatGPT weight ≤ 15 %
- No mint / sign / trade / payment authorization
