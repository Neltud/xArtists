"""
7-Day Shadow Sprint — SCAN → DECIDE (brain strategies) → SIMULATE → LOG.
Zero real capital. LIA_LIVE_TRADING=0.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import time
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from lia.shadow.friction import apply_friction_to_leg, enrich_legs

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
API = "https://api.multiversx.com"
ASSETS = ("EGLD", "TRO", "USDC")
SPRINT_DAYS = 7


def _utc() -> datetime:
    return datetime.now(timezone.utc)


def _ts(dt: datetime | None = None) -> str:
    return (dt or _utc()).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read(name: str) -> Any:
    path = DATA / name
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write(name: str, obj: Any) -> Path:
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / name
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / name,
        ROOT / "docs" / "data" / name,
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(obj, indent=2), encoding="utf-8")
        except OSError:
            pass
    return path


def scan_market() -> dict[str, Any]:
    out: dict[str, Any] = {
        "egld_usd": 20.0,
        "tro_usd": 0.0,
        "sentiment": 0.0,
        "volatility": 0.35,
        "ts": _ts(),
        "error": None,
    }
    try:
        req = urllib.request.Request(
            f"{API}/economics", headers={"User-Agent": "xArtists-shadow-sprint/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            econ = json.loads(r.read().decode())
            px = float(econ.get("price") or 0)
            if px > 0:
                out["egld_usd"] = px
    except Exception as e:
        out["error"] = f"economics:{e}"
    try:
        req = urllib.request.Request(
            f"{API}/tokens/TRO-94c925",
            headers={"User-Agent": "xArtists-shadow-sprint/1.0"},
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            tok = json.loads(r.read().decode())
            out["tro_usd"] = float(tok.get("price") or 0) or out["egld_usd"] * 0.00015
    except Exception:
        out["tro_usd"] = out["egld_usd"] * 0.00015
    h = _utc().hour + _utc().minute / 60.0
    out["sentiment"] = round(math.sin(h / 24 * math.pi * 2) * 0.15 + random.uniform(-0.05, 0.05), 4)
    out["volatility"] = round(0.28 + abs(out["sentiment"]) * 0.4 + random.uniform(0, 0.08), 4)
    return out


def decide(scan: dict[str, Any]) -> dict[str, Any]:
    sent = float(scan.get("sentiment") or 0)
    vol = float(scan.get("volatility") or 0.35)
    conf = max(0.35, min(0.85, 0.55 + sent * 0.8 - (vol - 0.3) * 0.3))
    trend = "UP" if sent > 0.08 else "DOWN" if sent < -0.08 else "SIDEWAYS"
    strategy, strat_reason = "STRAT_YIELD_OPTIMIZER", "fallback"
    action = "HOLD"
    size_usd = 10.0
    try:
        from lia.brain.strategies import action_for, select_strategy
        from lia.brain.position_sizing import size_position

        strategy, strat_reason = select_strategy(
            sentiment=(sent + 1) / 2,
            volatility=vol,
            trend=trend,
            distance=abs(sent),
            confidence=conf,
            asset_state="Liquid",
            liquidity=max(0.1, 1.0 - vol),
        )
        action = action_for(strategy, trend=trend, distance=sent)
        if action in ("STAKE", "COMPOUND"):
            action = "BUY"
        if action == "FLATTEN":
            action = "SELL"
        if action == "MICRO_PROOF":
            action = "HOLD"
        sz = size_position(equity_usd=1000.0, confidence=conf, volatility=vol, max_usd=15.0)
        size_usd = float(sz.size_usd)
        try:
            from lia.guardian.beta_strike import preflight_trade

            pf = preflight_trade(confidence=conf, size_usd=size_usd, token="EGLD", live_trading=False)
            size_usd = pf.size_usd
        except Exception:
            pass
    except Exception:
        if sent > 0.08 and vol < 0.45:
            action = "BUY"
        elif sent < -0.08:
            action = "SELL"
        else:
            action = random.choice(["HOLD", "BUY", "HOLD"])
        size_usd = round(15 + conf * 40, 2)
    asset = random.choice(ASSETS) if action != "HOLD" else "EGLD"
    level = 2 if conf >= 0.6 else 1
    return {
        "action": action,
        "asset": asset,
        "confidence": round(conf, 4),
        "level": level,
        "size_usd": size_usd,
        "strategy": strategy,
        "reason": f"{strat_reason}|sent={sent:.3f}|vol={vol:.3f}|{strategy}",
    }


def simulate(decision: dict[str, Any], scan: dict[str, Any], *, ts: str | None = None) -> dict[str, Any]:
    action = decision["action"]
    edge = float(decision["confidence"]) * 0.4 - float(scan.get("volatility") or 0.35) * 0.5
    if action == "HOLD":
        raw_pnl = -0.02
    elif action == "BUY":
        raw_pnl = edge * decision["size_usd"] * 0.02 + random.uniform(-0.15, 0.25)
    else:
        raw_pnl = (-edge) * decision["size_usd"] * 0.015 + random.uniform(-0.2, 0.15)
    leg: dict[str, Any] = {
        "id": str(uuid.uuid4())[:12],
        "ts": ts or _ts(),
        "ok": True,
        "paper": True,
        "side": action,
        "asset": decision["asset"],
        "amount": decision["size_usd"],
        "size": decision["size_usd"],
        "strategy": decision.get("strategy"),
        "liquidity": max(0.1, 1.0 - float(scan.get("volatility") or 0.35)),
        "pnl_usd": round(raw_pnl, 6),
        "gate": {
            "decision": action,
            "confidence": decision["confidence"],
            "size_usd": decision["size_usd"],
            "source": "shadow_sprint",
            "level": decision["level"],
            "strategy": decision.get("strategy"),
            "allow_size": True,
        },
        "decision_proof": {
            "decision_id": str(uuid.uuid4())[:16],
            "action_name": action,
            "reason": decision["reason"],
            "paper": True,
        },
        "verification": "PaperOnly",
        "scan": {
            "egld_usd": scan.get("egld_usd"),
            "sentiment": scan.get("sentiment"),
            "volatility": scan.get("volatility"),
        },
    }
    return apply_friction_to_leg(leg, egld_usd=float(scan.get("egld_usd") or 20))


def load_legs() -> list[dict[str, Any]]:
    raw = _read("lia_paper_legs.json") or {}
    legs = raw.get("legs") if isinstance(raw, dict) else None
    if not isinstance(legs, list):
        return []
    return [x for x in legs if isinstance(x, dict)]


def append_leg(leg: dict[str, Any], *, max_keep: int = 500) -> list[dict[str, Any]]:
    legs = load_legs()
    legs.append(leg)
    legs = legs[-max_keep:]
    _write(
        "lia_paper_legs.json",
        {"updated": _ts(), "paper": True, "legs": legs, "source": "shadow_sprint"},
    )
    return legs


def equity_curve(legs: list[dict[str, Any]], start_usd: float = 1000.0) -> list[dict[str, Any]]:
    eq = start_usd
    curve: list[dict[str, Any]] = [{"ts": legs[0]["ts"] if legs else _ts(), "equity": start_usd}]
    for leg in legs:
        pnl = leg.get("pnl_usd_friction")
        if pnl is None:
            pnl = leg.get("pnl_usd") or 0
        try:
            eq += float(pnl)
        except (TypeError, ValueError):
            pass
        curve.append({"ts": leg.get("ts") or _ts(), "equity": round(eq, 4)})
    return curve


def sprint_meta(legs: list[dict[str, Any]]) -> dict[str, Any]:
    meta = _read("lia_shadow_sprint.json") or {}
    if not isinstance(meta, dict):
        meta = {}
    start = meta.get("started_at") or _ts()

    def parse_ts(s: str | None) -> datetime | None:
        if not s:
            return None
        try:
            return datetime.strptime(s.replace("Z", ""), "%Y-%m-%dT%H:%M:%S").replace(
                tzinfo=timezone.utc
            )
        except Exception:
            return None

    now = _utc()
    start_dt = parse_ts(str(start)) or now
    day_idx = max(0, (now - start_dt).days) + 1
    last24 = []
    for leg in legs:
        dt = parse_ts(str(leg.get("ts")))
        if dt and (now - dt) <= timedelta(hours=24):
            last24.append(leg)
    wins = sum(
        1 for leg in legs if float(leg.get("pnl_usd_friction") or leg.get("pnl_usd") or 0) > 0
    )
    pnl = sum(float(leg.get("pnl_usd_friction") or leg.get("pnl_usd") or 0) for leg in legs)
    curve = equity_curve(legs)
    out = {
        "schema": "lia_shadow_sprint/v1",
        "paper": True,
        "LIA_LIVE_TRADING": 0,
        "started_at": start,
        "updated_at": _ts(),
        "sprint_days_target": SPRINT_DAYS,
        "day_index": min(day_idx, SPRINT_DAYS),
        "status": "running" if day_idx <= SPRINT_DAYS else "complete",
        "fills_total": len(legs),
        "fills_24h": len(last24),
        "shadow_pnl_usd": round(pnl, 4),
        "win_rate": round(wins / len(legs), 4) if legs else None,
        "equity_curve": curve[-120:],
        "equity_start_usd": 1000.0,
        "equity_now_usd": curve[-1]["equity"] if curve else 1000.0,
        "note": "Simulated trading only — friction applied; not financial advice",
    }
    _write("lia_shadow_sprint.json", out)
    return out


def export_shadow(legs: list[dict[str, Any]], meta: dict[str, Any]) -> dict[str, Any]:
    enriched = enrich_legs(legs)
    export = {
        "schema": "lia_shadow_export/v1",
        "ts": _ts(),
        "paper": True,
        "fills": len(enriched),
        "shadow_pnl_usd": meta.get("shadow_pnl_usd"),
        "win_rate": meta.get("win_rate"),
        "equity_now_usd": meta.get("equity_now_usd"),
        "equity_curve": meta.get("equity_curve"),
        "day_index": meta.get("day_index"),
        "sprint_status": meta.get("status"),
        "last_shadow": [
            {
                "id": x.get("id"),
                "side": x.get("side"),
                "asset": x.get("asset"),
                "strategy": x.get("strategy"),
                "pnl_usd": x.get("pnl_usd_friction") or x.get("pnl_usd"),
                "ts": x.get("ts"),
            }
            for x in enriched[-8:]
        ],
        "friction_model": {
            "gas_egld_per_fill": 0.0008,
            "slippage": "liquidity_impact_0.05pct_to_2.5pct",
        },
        "source": "shadow_sprint",
        "note": "Server shadow export — zero real capital",
    }
    _write("lia_shadow_export.json", export)
    return export


def run_tick() -> dict[str, Any]:
    scan = scan_market()
    decision = decide(scan)
    leg = simulate(decision, scan)
    legs = append_leg(leg)
    meta = sprint_meta(legs)
    export = export_shadow(legs, meta)
    try:
        from lia.intent.server_intent import intent_from_sprint_decision, write_intent_snapshot

        write_intent_snapshot(intent_from_sprint_decision(decision, leg_id=str(leg.get("id"))))
    except Exception:
        pass
    return {
        "tick": {"scan": scan, "decision": decision, "leg_id": leg.get("id")},
        "meta": {
            "day_index": meta.get("day_index"),
            "fills": meta.get("fills_total"),
            "pnl": meta.get("shadow_pnl_usd"),
            "status": meta.get("status"),
        },
        "export_fills": export.get("fills"),
    }


def seed_24h(n: int = 24) -> dict[str, Any]:
    now = _utc()
    legs = load_legs()
    for i in range(n):
        dt = now - timedelta(hours=n - i)
        scan = scan_market()
        scan["sentiment"] = round(math.sin(i / n * math.pi * 2) * 0.12, 4)
        scan["volatility"] = round(0.3 + (i % 5) * 0.03, 4)
        decision = decide(scan)
        leg = simulate(decision, scan, ts=_ts(dt))
        legs.append(leg)
    legs = legs[-500:]
    _write(
        "lia_paper_legs.json",
        {"updated": _ts(), "paper": True, "legs": legs, "source": "shadow_sprint_seed24h"},
    )
    meta = sprint_meta(legs)
    export = export_shadow(legs, meta)
    return {
        "seeded": n,
        "fills": len(legs),
        "pnl": meta.get("shadow_pnl_usd"),
        "export": export.get("schema"),
    }


def status() -> dict[str, Any]:
    meta = _read("lia_shadow_sprint.json") or {}
    export = _read("lia_shadow_export.json") or {}
    legs = load_legs()
    return {
        "sprint": meta,
        "export_schema": export.get("schema") if isinstance(export, dict) else None,
        "legs": len(legs),
        "paper": True,
        "LIA_LIVE_TRADING": 0,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="LIA 7-day shadow sprint")
    ap.add_argument("--seed-24h", action="store_true")
    ap.add_argument("--status", action="store_true")
    args = ap.parse_args()
    if args.status:
        print(json.dumps(status(), indent=2))
        return
    if args.seed_24h:
        print(json.dumps(seed_24h(), indent=2))
        return
    print(json.dumps(run_tick(), indent=2))


if __name__ == "__main__":
    main()
