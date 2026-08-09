# Autonomous trading agents — LIA

## What runs

| Agent | Rôle |
|-------|------|
| **DEFENSE** | Veto si fear≤25, DD≥12%, loss streak, regime RISK_OFF |
| **MOMENTUM** | Trend 7d + bias GSN |
| **MEAN_REV** | RSI + écart VWAP |
| **MICRO_ARB** | Spread DEX (block-time, fees×2.5) |
| **YIELD** | Fallback idle → sleeve yield |

Coordinator: 1 trade de risque max / cycle, sinon YIELD/WAIT.  
**PreFlight** (VaR/Kelly/kill) + **million_path** phase sizing.  
Paper fill → `path_executor_hooks.after_trade_close`.

## Run (Vellum cadence)

```bash
export LIA_LIVE_TRADING=0
PYTHONPATH=. python -m lia.agents.run_autonomous --mode swarm
# state: data/lia_swarm_state.json
```

Legacy open-loop (STATARB + multi-horizon):

```bash
PYTHONPATH=. python -m lia.agents.run_autonomous --mode legacy
# or: python -m lia.circuit.autonomous_loop
```

## Safety

- CLI **refuse** si `LIA_LIVE_TRADING=1` sans policy micro-proof
- Pas de signature dans le swarm — UniversalExecutor + PEM seulement plus tard
- Live SOL perps >1.5x bloqués par PreFlight/Guardian

## Module

`lia/agents/autonomous_swarm.py` (copier depuis artifacts si absent sur main)

```python
from lia.agents.autonomous_swarm import run_swarm_cycle
run_swarm_cycle(market={...}, book={...})
```
