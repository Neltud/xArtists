"""
LIA Vellum Orchestrator — production pipeline (Sprint B)
=======================================================
Order:
  1. Env bootstrap (chain=1, live flag)
  2. Optional DataHub-shaped inputs (caller passes market)
  3. mvx_agent.decide
  4. Guardian gate (before compound / size-up)
  5. live_cycle.run_cycle (trailing)
  6. compound open/tick if BUY and guardian + can_open (tp_mode=log)
  7. RWA escrow intent on demo settle (paper)
  8. publish_hatom + publish_data_for_frontend

LIA_LIVE_TRADING must be 0 until Sprint A SC + blackbox done.
PEM never logged. Guardian before Brain.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]


def env_bootstrap() -> dict[str, Any]:
    chain = os.environ.get("LIA_CHAIN_ID") or os.environ.get("CHAIN") or "1"
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    return {
        "chain_id": str(chain),
        "api": os.environ.get("LIA_MVX_API", "https://api.multiversx.com"),
        "proxy": os.environ.get("LIA_MVX_PROXY", "https://gateway.multiversx.com"),
        "live_trading": live,
        "tp_mode": os.environ.get("LIA_TP_MODE", "log"),
        "mainnet_only": str(chain) == "1",
    }


def run_orchestrator(
    *,
    market: Optional[dict[str, Any]] = None,
    publish: bool = True,
    compound_demo: bool = False,
    portfolio: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    boot = env_bootstrap()
    out: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "bootstrap": boot,
    }

    if not boot["mainnet_only"]:
        out["error"] = "MAINNET ONLY — refuse chain != 1"
        return out

    m = market or {
        "token": "WEGLD-bd4d79",
        "price": 0.0,
        "vwap_24h": 0.0,
        "rsi_14": 50.0,
        "liquidity_usd": 100_000.0,
        "price_change_1h": 0.0,
        "price_change_24h": 0.0,
        "volume_spike": 1.0,
        "gs_regime": "NEUTRAL",
        "gs_bias": "NEUTRAL",
        "atr": 0.0,
    }
    pf = portfolio or {
        "equity_usd": 100.0,
        "notional_usd": 0.0,
        "drawdown": 0.0,
        "consecutive_wins": 0,
    }

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
        out["agent"] = decision.to_dict()
    except Exception as e:
        out["agent"] = {"error": str(e)}
        decision = None

    # --- Guardian before any size-up / compound ---
    equity = float(pf.get("equity_usd") or 100)
    size_hint = float((out.get("agent") or {}).get("size_usd_hint") or 0)
    notional = float(pf.get("notional_usd") or 0) or size_hint
    mode = str(m.get("mode") or ("DEFENSE" if str(m.get("gs_regime") or "").upper() == "RISK_OFF" else "COMPOUND"))
    try:
        from lia.vellum.guardian_hook import check_before_open

        g = check_before_open(
            equity_usd=equity,
            notional_usd=max(notional, size_hint),
            ret_roe=float(pf.get("ret_roe") or 0),
            drawdown=float(pf.get("drawdown") or 0),
            compound_intensity=float(pf.get("compound_intensity") or 0.2),
            consecutive_wins=int(pf.get("consecutive_wins") or 0),
            mode=mode,
        )
        out["guardian"] = g
    except Exception as e:
        out["guardian"] = {"allow": False, "reason": f"guardian_error:{e}"}
        g = out["guardian"]

    try:
        from lia.vellum.live_cycle import run_cycle

        d = out.get("agent") or {}
        live = run_cycle(
            decision=str(d.get("action") or "WAIT"),
            confidence=float(d.get("confidence") or 0.4),
            size_usd=float(d.get("size_usd_hint") or 0),
            token=str(d.get("token") or m.get("token") or "WEGLD-bd4d79"),
            entry=float(m.get("price") or 0) or None,
            atr=float(m.get("atr") or 0),
            side="LONG",
        )
        out["live_cycle"] = live
    except Exception as e:
        out["live_cycle"] = {"error": str(e)}

    try:
        from lia.circuit.compound_engine import CircuitConfig, CompoundCircuit

        cfg = CircuitConfig(tp_mode=str(boot.get("tp_mode") or "log"))
        circuit = CompoundCircuit(config=cfg)
        health = circuit.health()
        out["compound_health"] = health

        guardian_ok = bool(g.get("allow"))
        if (
            compound_demo
            and guardian_ok
            and decision
            and decision.action == "BUY"
            and decision.executable
            and float(m.get("price") or 0) > 0
            and health.get("can_open", (False,))[0]
        ):
            deploy = min(
                float(decision.size_usd_hint or 10),
                float(g.get("max_notional") or 10),
            )
            t = circuit.open_trade(
                token=str(decision.token),
                entry=float(m["price"]),
                deployable_usd=deploy,
                pre_balance_usd=equity,
                tp_mode=cfg.tp_mode,
            )
            out["compound_open"] = t.to_dict() if t else None
            if t:
                tick = circuit.on_tick(float(m["price"]) * 1.01)
                out["compound_tick"] = tick
                # Paper settle path → RWA intent journal
                try:
                    from lia.vellum.guardian_hook import on_trade_settled

                    out["rwa_intent"] = on_trade_settled(
                        trade_id=str(getattr(t, "id", None) or f"paper-{out['ts']}"),
                        pnl_usd=float((tick or {}).get("unrealized_pnl_usd") or 0.5),
                        equity_usd=equity,
                        notional_usd=deploy,
                        ret_roe=0.01,
                        drawdown=float(pf.get("drawdown") or 0),
                        compound_intensity=0.2,
                        consecutive_wins=int(pf.get("consecutive_wins") or 0),
                        mode=mode,
                        persist=True,
                    )
                except Exception as e:
                    out["rwa_intent"] = {"error": str(e)}
        else:
            out["compound_open"] = None
            if compound_demo and not guardian_ok:
                out["compound_blocked_by_guardian"] = g.get("reason")
    except Exception as e:
        out["compound"] = {"error": str(e)}

    if not boot["live_trading"]:
        out["executor"] = {"live": False, "note": "LIA_LIVE_TRADING=0 — no PEM sends"}

    if publish:
        try:
            from lia.vellum.publish_hatom import publish as pub_hatom

            out["hatom_path"] = str(pub_hatom())
        except Exception as e:
            out["hatom_publish"] = {"ok": False, "error": str(e)}
        try:
            from lia.vellum.publish_data_for_frontend import publish as pub

            pub()
            out["publish"] = {"ok": True}
        except Exception as e:
            out["publish"] = {"ok": False, "error": str(e)}

    try:
        status_path = ROOT / "data" / "lia_v6_status.json"
        status = {}
        if status_path.exists():
            try:
                status = json.loads(status_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                status = {}
        status["updated"] = out["ts"]
        status["orchestrator"] = {
            "chain_id": boot["chain_id"],
            "live_trading": boot["live_trading"],
            "tp_mode": boot["tp_mode"],
            "agent_action": (out.get("agent") or {}).get("action"),
            "guardian": out.get("guardian"),
        }
        status_path.parent.mkdir(parents=True, exist_ok=True)
        status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")
        out["status_written"] = str(status_path)
    except Exception as e:
        out["status_error"] = str(e)

    return out


if __name__ == "__main__":
    print(json.dumps(run_orchestrator(publish=False, compound_demo=False), indent=2))
