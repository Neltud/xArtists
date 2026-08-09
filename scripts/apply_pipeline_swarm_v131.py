#!/usr/bin/env python3
"""Insert swarm step into lia/vellum/pipeline.py and bump VERSION to 1.3.1."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "lia" / "vellum" / "pipeline.py"
t = p.read_text(encoding="utf-8")
if "5a Autonomous swarm" in t:
    print("already applied")
    raise SystemExit(0)
t = t.replace('VERSION = "1.3"', 'VERSION = "1.3.1"', 1)
block = '''
    # --- 5a Autonomous swarm (paper multi-agent) ---
    t0 = time.perf_counter()
    try:
        from lia.agents.autonomous_swarm import run_swarm_cycle

        swarm_book = {
            "equity_usd": float(pf.get("equity_usd") or pf.get("total_usd") or 100),
            "deployable_usd": float(pf.get("deployable_usd") or (pf.get("equity_usd") or 100) * 0.4),
            "drawdown": float(pf.get("drawdown") or 0),
            "consecutive_wins": int(pf.get("consecutive_wins") or 0),
            "consecutive_losses": int(pf.get("consecutive_losses") or 0),
        }
        swarm_m = {
            **m,
            "fear_greed": m.get("fear_greed", 50),
            "dex_a": float(m.get("price_dex_a") or m.get("dex_a") or 0),
            "dex_b": float(m.get("price_dex_b") or m.get("dex_b") or 0),
        }
        swarm_out = run_swarm_cycle(market=swarm_m, book=swarm_book, persist=publish, settle=True)
        report["swarm"] = {
            "action": (swarm_out.get("decision") or {}).get("action"),
            "lead": (swarm_out.get("decision") or {}).get("lead_agent"),
            "size": (swarm_out.get("decision") or {}).get("size_usd"),
            "phase": (swarm_out.get("decision") or {}).get("phase"),
            "pnl": (swarm_out.get("fill") or {}).get("pnl_usd"),
        }
        _step(report, "swarm", True, t0, action=report["swarm"].get("action"), lead=report["swarm"].get("lead"))
    except Exception as e:
        _step(report, "swarm", True, t0, skipped=True, note=str(e)[:120])

'''
needle = '        _step(report, "agent", False, t0, error=str(e))\n\n    # --- 5b Desk + fuse ---'
if needle not in t:
    raise SystemExit("needle not found — pipeline structure changed")
t = t.replace(needle, '        _step(report, "agent", False, t0, error=str(e))\n' + block + '    # --- 5b Desk + fuse ---')
p.write_text(t, encoding="utf-8")
print("wrote", p, "VERSION 1.3.1 + swarm step")
