#!/usr/bin/env python3
"""Add allocate_budget + fuse_brain_outputs aliases if missing (CI regression)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "lia" / "orchestration" / "symbiosis.py"
t = p.read_text(encoding="utf-8")
if "def allocate_budget" in t:
    print("already present")
    raise SystemExit(0)
alias = '''

def fuse_brain_outputs(outputs, *, deployable_usd=100.0, gs_regime="NEUTRAL"):
    return fuse_votes(votes_from_brain_outputs(outputs), deployable_usd=deployable_usd, gs_regime=gs_regime)

def allocate_budget(strategy, deployable_usd, *, override_pct=None):
    reg = STRATEGY_REGISTRY.get(strategy) or {}
    pct = float(override_pct if override_pct is not None else reg.get("default_budget_pct") or 0.05)
    pct = max(0.0, min(pct, GLOBAL_ENTRY_BUDGET_CAP))
    return {"strategy": strategy, "budget_pct": pct, "amount_usd": round(deployable_usd * pct, 4), "venue": reg.get("venue", "auto")}

'''
if 'if __name__ == "__main__":' not in t:
    t += alias
else:
    t = t.replace('if __name__ == "__main__":', alias + 'if __name__ == "__main__":')
p.write_text(t, encoding="utf-8")
print("aliases written")
