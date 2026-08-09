"""
LIA Vellum — unified trading + data pipeline (canonical entry).
==============================================================
Organized cycle:
  bootstrap → oracles → gas → board → (social soft) → agent
  → desk debate + fuse → mode select → Guardian → TradingStack → arb scan
  → hatom → mirror → status / vellum_last_run

Never sends PEM unless LIA_LIVE_TRADING=1 (still gated).
Mainnet only (CHAIN=1).
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _step(report: dict, sid: str, ok: bool, **extra: Any) -> None:
    row = {"id": sid, "ok": ok, **extra}
    report.setdefault("steps", []).append(row)


def run_pipeline(
    *,
    market: Optional[dict[str, Any]] = None,
    portfolio: Optional[dict[str, Any]] = None,
    publish: bool = True,
    run_stack_demo: bool = False,
) -> dict[str, Any]:
    if "LIA_LIVE_TRADING" not in os.environ:
        os.environ["LIA_LIVE_TRADING"] = "0"
    if "CHAIN" not in os.environ:
        os.environ["CHAIN"] = "1"

    chain = str(os.environ.get("CHAIN") or os.environ.get("LIA_CHAIN_ID") or "1")
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE", "yes")
    report: dict[str, Any] = {
        "ts": _ts(),
        "pipeline": "lia.vellum.pipeline",
        "version": "1.2",
        "live": live,
        "chain_id": chain,
        "steps": [],
        "policy": "Guardian before Brain · paper until micro-proof",
    }

    if chain != "1":
        report["error"] = "MAINNET ONLY — refuse chain != 1"
        _step(report, "bootstrap", False, error=report["error"])
        return report
    _step(report, "bootstrap", True, live=live, tp_mode=os.environ.get("LIA_TP_MODE", "log"))

    try:
        from lia.oracles.publish import publish as oracle_pub

        p = oracle_pub()
        egld = 0.0
        op = ROOT / "data" / "oracle_prices.json"
        if op.exists():
            oj = json.loads(op.read_text(encoding="utf-8"))
            egld = float(oj.get("egld_usd") or oj.get("price") or 0)
        _step(report, "oracles", True, path=str(p), egld_usd=egld)
        report["egld_usd"] = egld
    except Exception as e:
        _step(report, "oracles", False, error=str(e))
        egld = 0.0

    try:
        from lia.gas.publish import publish as gas_pub

        _step(report, "gas", True, path=str(gas_pub()))
    except Exception as e:
        _step(report, "gas", False, error=str(e))

    try:
        from lia.board.publish import publish as board_pub

        _step(report, "board", True, path=str(board_pub()))
    except Exception as e:
        _step(report, "board", False, error=str(e))

    try:
        from lia.signals.social_intel import refresh as social_refresh  # type: ignore

        s = social_refresh() if callable(social_refresh) else {}
        _step(report, "social", True, summary=str(s)[:120] if s else "ok")
    except Exception as e:
        _step(report, "social", True, skipped=True, note=str(e)[:80])

    m = dict(market or {})
    m.setdefault("token", "WEGLD-bd4d79")
    if not float(m.get("price") or 0) and egld > 0:
        m["price"] = egld
    m.setdefault("vwap_24h", float(m.get("price") or 0))
    m.setdefault("rsi_14", 50.0)
    m.setdefault("liquidity_usd", 100_000.0)
    m.setdefault("gs_regime", "NEUTRAL")
    m.setdefault("gs_bias", "NEUTRAL")
    m.setdefault("atr", 0.0)

    pf = portfolio or {
        "equity_usd": 100.0,
        "notional_usd": 0.0,
        "drawdown": 0.0,
        "consecutive_wins": 0,
        "ret_roe": 0.0,
        "compound_intensity": 0.2,
    }

    decision = None
    try:
        from lia.agents.mvx_agent import decide

        decision = decide(
            token=str(m.get("token") or "WEGLD-bd4d79"),
            price=float(m.get("price") or 0),
            vwap_24h=float(m.get("vwap_24h") or 0),
            rsi_14=float(m.get("rsi_14") or 50),
            liquidity_usd=float(m.get("liquidity_usd") or 100_000),
            price_change_1h=float(m.get("price_change_1h") or 0),
            price_change_24h=float(m.get("price_change_24h") or 0),
            volume_spike=float(m.get("volume_spike") or 1),
            gs_regime=str(m.get("gs_regime") or "NEUTRAL"),
            gs_bias=str(m.get("gs_bias") or "NEUTRAL"),
            price_dex_a=float(m.get("price_dex_a") or 0),
            price_dex_b=float(m.get("price_dex_b") or 0),
            include_cross_chain_signals=False,
        )
        ad = decision.to_dict() if hasattr(decision, "to_dict") else dict(decision)
        report["agent"] = ad
        _step(report, "agent", True, action=ad.get("action"), confidence=ad.get("confidence"))
    except Exception as e:
        report["agent"] = {"error": str(e)}
        _step(report, "agent", False, error=str(e))
        ad = {}

    try:
        from lia.circuit.desk_debate import debate as desk_debate, fuse_agent_desk

        desk = desk_debate(
            price=float(m.get("price") or 0),
            vwap_24h=float(m.get("vwap_24h") or 0),
            rsi_14=float(m.get("rsi_14") or 50),
            price_change_1h=float(m.get("price_change_1h") or 0),
            price_change_24h=float(m.get("price_change_24h") or 0),
            volume_spike=float(m.get("volume_spike") or 1),
            gs_regime=str(m.get("gs_regime") or "NEUTRAL"),
            gs_bias=str(m.get("gs_bias") or "NEUTRAL"),
            fear_greed=m.get("fear_greed"),
            rumor_flag=bool(m.get("rumor_flag")),
            drawdown=float(pf.get("drawdown") or 0),
            spread_edge=float(m.get("spread_edge") or 0),
        )
        report["desk"] = desk.to_dict()
        fused = fuse_agent_desk(
            str(ad.get("action") or "WAIT"),
            float(ad.get("confidence") or 0),
            desk,
            agent_size_hint=float(ad.get("size_usd_hint") or 0),
        )
        report["fuse"] = fused
        _step(
            report,
            "desk",
            True,
            action=desk.action,
            risk_veto=desk.risk_veto,
            confidence=desk.confidence,
            agreement=getattr(desk, "agreement", None),
            fuse=fused.get("source"),
        )
        if not ad.get("action") or str(ad.get("action")).upper() in ("WAIT", "HOLD", ""):
            report["desk_fuse_hint"] = fused.get("action") or desk.action
    except Exception as e:
        _step(report, "desk", False, error=str(e))

    try:
        from lia.circuit.trading_modes import select_mode

        desk_v = report.get("desk") or {}
        fuse_action = str(ad.get("action") or "WAIT")
        if desk_v.get("risk_veto"):
            fuse_action = "YIELD"
        elif fuse_action.upper() in ("WAIT", "HOLD", "") and report.get("desk_fuse_hint"):
            fuse_action = str(report["desk_fuse_hint"])
        mode = select_mode(
            gs_regime=str(m.get("gs_regime") or "NEUTRAL"),
            fuse_action=fuse_action,
            fuse_strategy=str(ad.get("strategy") or ad.get("primary_strategy") or ""),
            fuse_confidence=float(ad.get("confidence") or desk_v.get("confidence") or 0),
            fear_greed=m.get("fear_greed"),
            rumor_flag=bool(m.get("rumor_flag")),
            has_open_position=bool(pf.get("has_open_position")),
            drawdown_pct=float(pf.get("drawdown") or 0),
        )
        report["mode"] = mode.to_dict() if hasattr(mode, "to_dict") else {"id": str(mode)}
        _step(report, "mode", True, mode_id=report["mode"].get("id"))
        mode_id = str(report["mode"].get("id") or "YIELD")
    except Exception as e:
        mode_id = "YIELD"
        report["mode"] = {"id": mode_id, "error": str(e)}
        _step(report, "mode", False, error=str(e))

    equity = float(pf.get("equity_usd") or 100)
    size_hint = float(ad.get("size_usd_hint") or 0)
    notional = float(pf.get("notional_usd") or 0) or size_hint
    try:
        from lia.vellum.guardian_hook import check_before_open

        g = check_before_open(
            equity_usd=equity,
            notional_usd=max(notional, size_hint, 1.0),
            ret_roe=float(pf.get("ret_roe") or 0),
            drawdown=float(pf.get("drawdown") or 0),
            compound_intensity=float(pf.get("compound_intensity") or 0.2),
            consecutive_wins=int(pf.get("consecutive_wins") or 0),
            mode=mode_id,
        )
        report["guardian"] = g
        _step(report, "guardian", bool(g.get("allow")), reason=g.get("reason"))
    except Exception as e:
        g = {"allow": False, "reason": f"guardian_error:{e}"}
        report["guardian"] = g
        _step(report, "guardian", False, error=str(e))

    try:
        from lia.circuit.trading_stack import TradingStack

        stack = TradingStack()
        stack_out: dict[str, Any] = {"status": stack.status()}
        if run_stack_demo and g.get("allow") and mode_id not in ("DEFENSE", "RISK_OFF"):
            if str(ad.get("action") or "").upper() == "BUY" and float(m.get("price") or 0) > 0:
                prop = stack.propose_entry(
                    strategy=str(ad.get("strategy") or "MOMENTUM"),
                    chain="multiversx",
                    token=str(m.get("token") or "WEGLD-bd4d79"),
                    entry=float(m["price"]),
                    size_usd=min(float(ad.get("size_usd_hint") or 10), float(g.get("max_notional") or 25)),
                    equity_usd=equity,
                    expected_gross=0.015,
                    mode=mode_id,
                    drawdown=float(pf.get("drawdown") or 0),
                    consecutive_wins=int(pf.get("consecutive_wins") or 0),
                    tp_mode=os.environ.get("LIA_TP_MODE", "log"),
                    atr=float(m.get("atr") or 0),
                )
                stack_out["propose"] = prop
        stack_out["arb"] = stack.scan_cross_arb(force_paper=True)
        stack_out["status"] = stack.status()
        report["trading_stack"] = {
            "live_flag": live,
            "ledger": stack_out["status"].get("ledger"),
            "arb_best": ((stack_out.get("arb") or {}).get("scan") or {}).get("best"),
        }
        _step(report, "trading_stack", True, mode=mode_id, guardian_allow=bool(g.get("allow")))
    except Exception as e:
        _step(report, "trading_stack", False, error=str(e))

    try:
        from lia.vellum.live_cycle import run_cycle

        live_c = run_cycle(
            decision=str(ad.get("action") or "WAIT"),
            confidence=float(ad.get("confidence") or 0.4),
            size_usd=float(ad.get("size_usd_hint") or 0),
            token=str(ad.get("token") or m.get("token") or "WEGLD-bd4d79"),
            entry=float(m.get("price") or 0) or None,
            atr=float(m.get("atr") or 0),
            side="LONG",
        )
        report["live_cycle"] = live_c
        _step(report, "live_cycle", True)
    except Exception as e:
        _step(report, "live_cycle", False, error=str(e))

    try:
        from lia.vellum.publish_hatom import publish as pub_hatom

        _step(report, "hatom", True, path=str(pub_hatom()))
    except Exception as e:
        try:
            from lia.venues.hatom import publish_hatom

            _step(report, "hatom", True, path=str(publish_hatom()))
        except Exception as e2:
            _step(report, "hatom", False, error=str(e2))

    if publish:
        try:
            from lia.vellum.publish_data_for_frontend import publish as mirror

            mres = mirror()
            _step(report, "mirror", bool(mres.get("ok", True)), copied=mres.get("copied"), missing=mres.get("missing"))
        except Exception as e:
            _step(report, "mirror", False, error=str(e))
    else:
        _step(report, "mirror", True, skipped=True)

    try:
        from lia.executor.universal import health_report

        report["executor"] = health_report()
        _step(report, "executor_health", True, live=live)
    except Exception as e:
        _step(report, "executor_health", False, error=str(e))

    if live:
        _step(report, "live_trading", False, error="LIVE=1 — no auto-send in pipeline")
    else:
        _step(report, "live_trading", True, skipped=True, LIA_LIVE_TRADING=0)

    try:
        status_path = ROOT / "data" / "lia_v6_status.json"
        status: dict[str, Any] = {}
        if status_path.exists():
            try:
                status = json.loads(status_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                status = {}
        status["updated"] = report["ts"]
        status["timestamp"] = report["ts"]
        status["LIA_LIVE_TRADING"] = 1 if live else 0
        status["status"] = status.get("status") or "monitoring"
        status["orchestrator"] = {
            "pipeline": "lia.vellum.pipeline",
            "version": "1.2",
            "chain_id": chain,
            "live_trading": live,
            "agent_action": ad.get("action"),
            "desk_action": (report.get("desk") or {}).get("action"),
            "fuse": report.get("fuse"),
            "mode": mode_id,
            "guardian": report.get("guardian"),
        }
        status_path.parent.mkdir(parents=True, exist_ok=True)
        status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")
        _step(report, "status", True, path=str(status_path))
    except Exception as e:
        _step(report, "status", False, error=str(e))

    out = ROOT / "data" / "vellum_last_run.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    slim = {k: v for k, v in report.items() if k != "trading_stack_detail"}
    out.write_text(json.dumps(slim, indent=2, default=str), encoding="utf-8")
    report["wrote"] = str(out)
    for dest in (ROOT / "docs" / "data", ROOT / "apps" / "frontend" / "public" / "data"):
        try:
            dest.mkdir(parents=True, exist_ok=True)
            (dest / "vellum_last_run.json").write_text(json.dumps(slim, indent=2, default=str), encoding="utf-8")
        except OSError:
            pass

    report["ok"] = all(
        s.get("ok", True) for s in report["steps"] if s.get("id") in ("bootstrap", "guardian", "agent")
    )
    return report


def main() -> dict[str, Any]:
    return run_pipeline(publish=True, run_stack_demo=False)


if __name__ == "__main__":
    print(json.dumps(main(), indent=2, default=str))
