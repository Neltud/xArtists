# Bootstrap critical modules

On a fresh clone, `compound_engine` may still be a placeholder and swarm/path/preflight may be missing.

## One-shot

```bash
bash scripts/bootstrap_critical.sh
```

Requires on `scripts/`:

- `apply_compound_and_path.py` → compound_engine + million_path
- `apply_preflight_stack.py` → preflight + orchestrator + guardian_hook
- `apply_autonomous_swarm.py` → autonomous_swarm

Copy from session artifacts if not yet on main:

```bash
cp /path/to/artifacts/apply_*.py scripts/
cp /path/to/artifacts/autonomous_swarm.py lia/agents/
cp /path/to/artifacts/million_path.py lia/circuit/
cp /path/to/artifacts/preflight.py lia/guardian/
cp /path/to/artifacts/compound_engine_FIXED.py lia/circuit/compound_engine.py
```

## Verify

```bash
export LIA_LIVE_TRADING=0
PYTHONPATH=. python -m lia.agents.run_autonomous --mode swarm
PYTHONPATH=. python tests/regression/run_all.py
```

## Pipeline

v1.3.1 adds step `swarm` after single `mvx_agent` (paper multi-agent).
