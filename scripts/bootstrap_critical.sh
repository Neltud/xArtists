#!/usr/bin/env bash
# Restore compound, million_path, preflight, swarm from embedded apply scripts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
for s in apply_compound_and_path.py apply_preflight_stack.py apply_autonomous_swarm.py; do
  if [[ -f "scripts/$s" ]]; then
    echo "==> $s"
    python3 "scripts/$s"
  else
    echo "MISSING scripts/$s — copy from session artifacts"
  fi
done
export LIA_LIVE_TRADING=0
PYTHONPATH=. python3 -c "
from lia.circuit.compound_engine import CompoundCircuit
from lia.circuit.million_path import compounds_needed
from lia.guardian.preflight import PreFlightValidator
from lia.agents.autonomous_swarm import run_swarm_cycle
print('CompoundCircuit', CompoundCircuit)
print('steps 3->1M', compounds_needed(3, 1e6, 0.01))
print('PreFlight', PreFlightValidator)
print('swarm', run_swarm_cycle(market={'price':10,'rsi_14':30,'trend_7d_pct':4,'gs_bias':'BULL','fear_greed':50}, book={'equity_usd':200,'deployable_usd':50}, persist=False, settle=False)['decision']['action'])
"
echo OK bootstrap_critical
