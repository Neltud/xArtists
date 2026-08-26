"""
Vellum production entry — one command for operator.

  PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1 python -m lia.vellum.production_run

Phases: chain_timing → gates → pipeline → commander → compounding (soft)
        → signals fusion (soft) → mirror → optional deploy_scs.
Never sets LIA_LIVE_TRADING=1. Deploy only if VELLUM_DEPLOY_SCS=1 + PEM.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def phase_chain_timing() -> dict[str, Any]:
    """Probe /stats.refreshRate so executor polls match the live chain (Supernova auto)."""
    try:
        from lia.gas.chain_timing import probe_api, timing_defaults

        probed = probe_api()
        td = timing_defaults()
        return {
            "ok": bool(probed.get("ok")),
            "mode": td["mode"],
            "round_ms": td["round_ms"],
            "tx_status_poll_ms": td["tx_status_poll_ms"],
            "error": probed.get("error"),
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "mode": "pre_supernova"}


def phase_gates() -> dict[str, Any]:
    try:
        from lia.security.go_live_gates import evaluate_gates

        rep = evaluate_gates(check_network=True)
        if hasattr(rep, "to_dict"):
            return rep.to_dict()
        if isinstance(rep, dict):
            return rep
        return {"ok": False, "error": "unexpected gates type", "raw": str(rep)}
    except Exception as e:
        return {"ok": False, "error": str(e), "allow_live_trading": False}


def phase_pipeline() -> dict[str, Any]:
    from lia.vellum.pipeline import run_pipeline

    return run_pipeline(publish=True, run_stack_demo=False)


def phase_commander_enrich() -> dict[str, Any]:
    path = ROOT / "data" / "lia_v6_status.json"
    if not path.exists():
        return {"ok": False, "error": "no status file"}
    try:
        status = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        return {"ok": False, "error": str(e)}
    orch = status.setdefault("orchestrator", {})
    g = orch.setdefault("guardian", {})
    g.setdefault("allow", True)
    g.setdefault("reason", "ok")
    g.setdefault("kill_state", "ARMED")
    g.setdefault("spiral_score", 0.0)
    g.setdefault("effective_leverage", 1.0)
    orch.setdefault("mode", orch.get("mode") or "YIELD")
    orch.setdefault("live_trading", False)
    status["updated"] = _ts()
    status["timestamp"] = status["updated"]
    status.setdefault("LIA_LIVE_TRADING", 0)
    path.write_text(json.dumps(status, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_v6_status.json",
        ROOT / "docs" / "data" / "lia_v6_status.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return {"ok": True, "kill_state": g.get("kill_state"), "path": str(path)}


def phase_compounding() -> dict[str, Any]:
    """Soft-fail paper compounding (10 echelons). Never blocks the pipeline."""
    try:
        from lia.compounding.step import run_step

        return run_step({"compounding_legs": 10, "compounding_seed": None})
    except Exception as e:
        return {"ok": False, "soft": True, "module": "compounding", "error": str(e)}


def phase_signals() -> dict[str, Any]:
    """Soft-fail: GSN>=80% + Polymarket + free multi-domain → fusion + ticker."""
    try:
        from lia.signals.fusion import fuse

        r = fuse("WAIT", 0.5)
        f = r.get("fused") or {}
        return {
            "ok": True,
            "soft": True,
            "module": "signals_fusion",
            "decision": f.get("decision"),
            "confidence": f.get("confidence"),
            "source": f.get("source"),
            "gsn_elite": (r.get("legs") or {}).get("gsn", {}).get("n_elite"),
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "signals_fusion", "error": str(e)}


def phase_mirror() -> dict[str, Any]:
    from lia.vellum.publish_data_for_frontend import publish

    return publish()


def phase_deploy_scs() -> dict[str, Any]:
    if os.environ.get("VELLUM_DEPLOY_SCS", "0") != "1":
        return {"ok": True, "skipped": True, "reason": "VELLUM_DEPLOY_SCS!=1"}
    pem = os.environ.get("PEM") or os.environ.get("LIA_WALLET_PEM_PATH") or ""
    if not pem or not Path(pem).is_file():
        return {"ok": False, "error": "PEM missing"}
    try:
        from lia.vellum.deploy_scs_node import run as deploy_run

        return deploy_run()
    except Exception as e:
        return {"ok": False, "error": str(e)}


def run() -> dict[str, Any]:
    if "LIA_LIVE_TRADING" not in os.environ:
        os.environ["LIA_LIVE_TRADING"] = "0"
    if "CHAIN" not in os.environ:
        os.environ["CHAIN"] = "1"

    report: dict[str, Any] = {
        "ts": _ts(),
        "module": "lia.vellum.production_run",
        "LIA_LIVE_TRADING": os.environ.get("LIA_LIVE_TRADING", "0"),
        "CHAIN": os.environ.get("CHAIN", "1"),
        "phases": {},
    }

    report["phases"]["chain_timing"] = phase_chain_timing()
    report["phases"]["gates"] = phase_gates()
    report["phases"]["pipeline"] = phase_pipeline()
    report["phases"]["commander"] = phase_commander_enrich()
    report["phases"]["compounding"] = phase_compounding()
    report["phases"]["signals"] = phase_signals()
    report["phases"]["mirror"] = phase_mirror()
    report["phases"]["deploy_scs"] = phase_deploy_scs()

    pipe = report["phases"].get("pipeline") or {}
    comp = report["phases"].get("compounding") or {}
    sig = report["phases"].get("signals") or {}
    report["summary"] = {
        "pipeline_ok": bool(pipe.get("ok", pipe.get("summary", {}).get("ok"))),
        "guardian_allow": (pipe.get("summary") or {}).get("guardian_allow"),
        "mode": (pipe.get("summary") or {}).get("mode"),
        "commander_ok": bool((report["phases"].get("commander") or {}).get("ok")),
        "compounding_ok": bool(comp.get("ok")),
        "compounding_soft": bool(comp.get("soft", True)),
        "signals_ok": bool(sig.get("ok")),
        "signals_decision": sig.get("decision"),
        "mirror_copied": len((report["phases"].get("mirror") or {}).get("copied") or []),
        "deploy_skipped": bool((report["phases"].get("deploy_scs") or {}).get("skipped")),
        "allow_live_trading": bool(
            (report["phases"].get("gates") or {}).get("allow_live_trading")
        ),
    }
    out = ROOT / "data" / "vellum_production_run.json"
    try:
        out.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        report["wrote"] = str(out)
    except OSError:
        pass
    return report


def main() -> dict[str, Any]:
    return run()


if __name__ == "__main__":
    print(json.dumps(main(), indent=2, default=str))
