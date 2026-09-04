"""
Vellum production entry — one command for operator.

  PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1 python -m lia.vellum.production_run

Phases: chain_timing → gates → risk_manager → pipeline → commander → compounding
        → signals → pretrade → brain → paper_leg → commander_refresh → mirror
        → optional deploy_scs.
Never sets LIA_LIVE_TRADING=1. Deploy only if VELLUM_DEPLOY_SCS=1 + PEM.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
STRICT_SEQUENCE = [
    "paper_cycle",
    "publish_public_artifacts",
    "deploy_scs_if_requested_and_funded",
    "verify_codehash_onchain",
    "run_user_micro_smokes",
    "enable_live_ops_flags",
]


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _portfolio_drawdown() -> float:
    """Best-effort drawdown from published portfolio / status."""
    for name in ("lia_portfolio.json", "lia_v6_status.json"):
        p = ROOT / "data" / name
        if not p.is_file():
            continue
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        for key in ("drawdown", "drawdown_pct", "dd"):
            if key in j and j[key] is not None:
                try:
                    v = float(j[key])
                    return v / 100.0 if v > 1.0 else v
                except (TypeError, ValueError):
                    pass
        pf = j.get("portfolio") or j.get("book") or {}
        if isinstance(pf, dict) and pf.get("drawdown") is not None:
            try:
                v = float(pf["drawdown"])
                return v / 100.0 if v > 1.0 else v
            except (TypeError, ValueError):
                pass
    return 0.0


def phase_chain_timing() -> dict[str, Any]:
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


def phase_risk_manager() -> dict[str, Any]:
    """Hard drawdown ceiling — may set LOCKED (paper state file)."""
    try:
        from lia.security.risk_manager import RiskManager

        dd = _portfolio_drawdown()
        rm = RiskManager(persist=True)
        v = rm.check_safety_status(dd)
        return {
            "ok": v.ok,
            "module": "risk_manager",
            "locked": v.locked,
            "current_drawdown": v.current_drawdown,
            "max_allowed": v.max_allowed,
            "event": v.event,
            "reason": v.reason,
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "risk_manager", "error": str(e)}


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

    for name, key in (
        ("lia_brain_cycle.json", "brain"),
        ("lia_last_decision_proof.json", "last_decision_proof"),
        ("lia_pretrade_gate.json", "pretrade"),
        ("lia_paper_legs.json", "paper_legs"),
        ("risk_manager_state.json", "risk_manager"),
    ):
        p = ROOT / "data" / name
        if p.is_file():
            try:
                orch[key] = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                pass

    # Reflect risk lock on guardian kill_state for Commander UI
    rm = orch.get("risk_manager") or {}
    if rm.get("locked"):
        g["allow"] = False
        g["kill_state"] = "TRIPPED"
        g["reason"] = rm.get("last_event") or rm.get("lock_reason") or "risk_manager_locked"

    status["updated"] = _ts()
    status["timestamp"] = status["updated"]
    status.setdefault("LIA_LIVE_TRADING", 0)
    path.write_text(json.dumps(status, indent=2, default=str), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_v6_status.json",
        ROOT / "docs" / "data" / "lia_v6_status.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return {
        "ok": True,
        "kill_state": g.get("kill_state"),
        "risk_locked": bool(rm.get("locked")),
        "path": str(path),
    }


def phase_compounding() -> dict[str, Any]:
    try:
        from lia.compounding.step import run_step

        return run_step({"compounding_legs": 10, "compounding_seed": None})
    except Exception as e:
        return {"ok": False, "soft": True, "module": "compounding", "error": str(e)}


def phase_signals() -> dict[str, Any]:
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


def phase_pretrade_gate() -> dict[str, Any]:
    try:
        from lia.signals.pretrade_gate import enrich_status

        st = enrich_status()
        sig = (st.get("orchestrator") or {}).get("signals") or {}
        return {
            "ok": True,
            "soft": True,
            "module": "pretrade_gate",
            "fused": sig.get("fused"),
            "updated": sig.get("updated"),
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "pretrade_gate", "error": str(e)}


def phase_brain_cycle() -> dict[str, Any]:
    try:
        from lia.brain.cycle import run_brain_cycle

        r = run_brain_cycle()
        return {
            "ok": True,
            "soft": True,
            "module": "brain_cycle",
            "ev_viable": (r.get("ev") or {}).get("is_viable"),
            "has_proof": bool(r.get("decision_proof")),
            "verification": ((r.get("decision_proof") or {}).get("verification")),
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "brain_cycle", "error": str(e)}


def phase_paper_leg(
    brain_phase: dict[str, Any] | None = None,
    risk_phase: dict[str, Any] | None = None,
) -> dict[str, Any]:
    risk_phase = risk_phase or {}
    if risk_phase.get("locked"):
        return {
            "ok": True,
            "soft": True,
            "module": "paper_leg",
            "skipped": True,
            "reason": "risk_manager_locked",
            "paper": True,
        }
    brain_phase = brain_phase or {}
    if brain_phase.get("ok") and brain_phase.get("ev_viable") is False:
        return {
            "ok": True,
            "soft": True,
            "module": "paper_leg",
            "skipped": True,
            "reason": "ev_not_viable",
            "paper": True,
        }
    try:
        from lia.executor.paper_with_proof import execute_paper_leg

        leg = execute_paper_leg(
            decision="BUY",
            confidence=0.62,
            size_usd=15.0,
            require_ev=True,
        )
        return {
            "ok": bool(leg.get("ok")),
            "soft": True,
            "module": "paper_leg",
            "verification": leg.get("verification"),
            "reason": leg.get("reason"),
            "paper": True,
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "paper_leg", "error": str(e)}


def phase_mirror() -> dict[str, Any]:
    from lia.vellum.publish_data_for_frontend import publish

    return publish()


def phase_priority_gate(report: dict[str, Any]) -> dict[str, Any]:
    phases = report.get("phases") or {}
    pipeline = phases.get("pipeline") or {}
    commander = phases.get("commander_refresh") or phases.get("commander") or {}
    mirror = phases.get("mirror") or {}
    gates = phases.get("gates") or {}
    blockers: list[str] = []

    if str(report.get("LIA_LIVE_TRADING", "0")).strip() in ("1", "true", "TRUE", "yes"):
        blockers.append("LIA_LIVE_TRADING must stay 0 during Vellum publication/deploy")
    if not bool(gates.get("ok")):
        blockers.append("go_live_gates did not complete successfully")
    if not bool(pipeline.get("ok", (pipeline.get("summary") or {}).get("ok"))):
        blockers.append("paper pipeline failed before deploy step")
    if not bool(commander.get("ok")):
        blockers.append("commander status refresh failed")
    if not bool(mirror.get("ok")):
        blockers.append("public data mirror failed")

    return {
        "ok": not blockers,
        "blockers": blockers,
        "operator": "vellum",
        "mode": "pre-mainnet",
        "strict_sequence": STRICT_SEQUENCE,
        "refuse_priority_actions_without_proofs": True,
        "requires": {
            "paper_cycle": True,
            "public_artifacts": True,
            "mainnet_only": str(report.get("CHAIN", "1")) == "1",
            "live_trading_off": str(report.get("LIA_LIVE_TRADING", "0")) == "0",
        },
    }


def phase_deploy_scs(priority_gate: dict[str, Any] | None = None) -> dict[str, Any]:
    if os.environ.get("VELLUM_DEPLOY_SCS", "0") != "1":
        return {"ok": True, "skipped": True, "reason": "VELLUM_DEPLOY_SCS!=1"}
    gate = priority_gate or {}
    if not gate.get("ok"):
        return {
            "ok": False,
            "skipped": True,
            "reason": "priority_gate_blocked",
            "blockers": gate.get("blockers") or ["paper/publication prerequisites missing"],
        }
    pem = os.environ.get("PEM") or os.environ.get("LIA_WALLET_PEM_PATH") or ""
    if not pem or not Path(pem).is_file():
        # Also allow PEM text via deploy node
        if not (os.environ.get("LIA_WALLET_PEM") or "").startswith("-----"):
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
        "operator": "vellum",
        "LIA_LIVE_TRADING": os.environ.get("LIA_LIVE_TRADING", "0"),
        "CHAIN": os.environ.get("CHAIN", "1"),
        "release_doctrine": {
            "publication_operator": "vellum",
            "mode": "pre-mainnet",
            "mainnet_only": True,
            "keep_live_trading_off_until_micro_smokes": True,
            "require_verified_codehash_before_live_ui": True,
            "strict_sequence": STRICT_SEQUENCE,
        },
        "phases": {},
    }

    report["phases"]["chain_timing"] = phase_chain_timing()
    report["phases"]["gates"] = phase_gates()
    risk = phase_risk_manager()
    report["phases"]["risk_manager"] = risk
    report["phases"]["pipeline"] = phase_pipeline()
    report["phases"]["commander"] = phase_commander_enrich()
    report["phases"]["compounding"] = phase_compounding()
    report["phases"]["signals"] = phase_signals()
    report["phases"]["pretrade_gate"] = phase_pretrade_gate()
    brain = phase_brain_cycle()
    report["phases"]["brain_cycle"] = brain
    report["phases"]["paper_leg"] = phase_paper_leg(brain, risk)
    report["phases"]["commander_refresh"] = phase_commander_enrich()
    report["phases"]["mirror"] = phase_mirror()
    report["phases"]["priority_gate"] = phase_priority_gate(report)
    report["phases"]["deploy_scs"] = phase_deploy_scs(report["phases"]["priority_gate"])

    pipe = report["phases"].get("pipeline") or {}
    leg = report["phases"].get("paper_leg") or {}
    report["summary"] = {
        "pipeline_ok": bool(pipe.get("ok", pipe.get("summary", {}).get("ok"))),
        "guardian_allow": (pipe.get("summary") or {}).get("guardian_allow"),
        "mode": (pipe.get("summary") or {}).get("mode"),
        "risk_locked": bool(risk.get("locked")),
        "risk_ok": bool(risk.get("ok")),
        "commander_ok": bool((report["phases"].get("commander") or {}).get("ok")),
        "compounding_ok": bool((report["phases"].get("compounding") or {}).get("ok")),
        "signals_ok": bool((report["phases"].get("signals") or {}).get("ok")),
        "pretrade_ok": bool((report["phases"].get("pretrade_gate") or {}).get("ok")),
        "brain_ok": bool(brain.get("ok")),
        "brain_ev_viable": brain.get("ev_viable"),
        "brain_has_proof": brain.get("has_proof"),
        "paper_leg_ok": bool(leg.get("ok")),
        "paper_leg_skipped": bool(leg.get("skipped")),
        "paper_leg_verify": leg.get("verification"),
        "mirror_copied": len((report["phases"].get("mirror") or {}).get("copied") or []),
        "priority_gate_ok": bool((report["phases"].get("priority_gate") or {}).get("ok")),
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
