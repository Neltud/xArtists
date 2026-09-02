# Audit — Swarm coordination + Compound engine (2026-08-09)

## Scope

- `lia/agents/swarm_roles.py` — DEFENSE / MOMENTUM / MEAN_REV / MICRO_ARB / YIELD
- `lia/agents/swarm_coord.py` — priority fuse + PreFlight sizing
- `lia/agents/autonomous_swarm.py` — cycle paper + journal
- `lia/agents/swarm_compound_bridge.py` — **integration** swarm → CompoundCircuit
- `lia/circuit/compound_engine.py` — open / tick / close / compound 70/30
- `lia/circuit/million_path.py` + `lia/guardian/preflight.py` — path + guardian

## Coordination mechanism

```
Market+Book
  → collect_proposals (5 agents)
  → sort by priority
  → DEFENSE VETO? → WAIT
  → first BUY/SELL conf≥0.62 → PreFlight (Kelly/VaR/kill) → size
  → else YIELD / WAIT
  → [bridge] can_open? → open_trade → on_tick → close_trade
  → settle_win / after_trade_close (lock ratio by phase)
```

## Compound engine logic

| Step | Behavior |
|------|----------|
| `can_open` | halt / cooldown / max losses / goal |
| `size_notional` | risk% / stop → cap deployable 22% |
| `levels` | stop −1%, target net+fees |
| `on_tick` | STOP_LOSS / TAKE_PROFIT / TRAIL / BE |
| `close_trade` | net after fees → 70% compound / 30% surplus |
| Cooldown | after win/loss (configurable) |

## Test results (this audit)

| Suite | Result |
|-------|--------|
| Regression `tests/regression/run_all.py` | **76/76 PASS** |
| `test_autonomous_swarm` | OK |
| `test_swarm_compound_bridge` | OK |
| Integrated multi 25 cycles | 15 opens / 15 closes (lab) |

## CLI

```bash
export LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.agents.run_autonomous --mode swarm
python -m lia.agents.run_autonomous --mode integrated
python -m lia.agents.paper_lab --cycles 50
```

## Residual risks

- Paper fill ≠ live fills
- `LIA_LIVE_TRADING=0` until micro-proofs
- SC marketplace undeployed

## Verdict

**Swarm coordination + compound engine integrated and regression-green.**
Cash path: deploy SC + user micro-TX remains P0.
