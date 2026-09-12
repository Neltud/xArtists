#!/usr/bin/env python3
"""GrokyversX — fuse LIA strategies S1/S2/S3 + momentum + external signals.

No Vellum required. Paper by default. Live only if GROK_LIVE_TRADING=1.
"""
from __future__ import annotations

import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")
ADDR = (os.environ.get("GROK_WALLET_ADDRESS") or
        "erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl").strip()
MODE = (os.environ.get("GROK_MODE") or "paper").lower()
LIVE = (os.environ.get("GROK_LIVE_TRADING") or "0").strip() == "1"
# micro profile (0.25 EGLD class)
MIN_RESERVE = float(os.environ.get("GROK_MIN_EGLD_RESERVE") or "0.15")
MAX_RISK_PCT = float(os.environ.get("GROK_MAX_RISK_PCT") or "5")
TP_PCT = float(os.environ.get("GROK_TP_PCT") or "1.7")
SL_PCT = float(os.environ.get("GROK_SL_PCT") or "1.0")

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)
STATE = DATA / "unified_state.json"

UNIVERSE = ["EGLD", "HTM-f51d55", "TRO-94c925", "ASH-a642d1"]


def get_json(path: str):
    req = urllib.request.Request(f"{API}{path}", headers={"User-Agent": "GrokyversX-unified/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def token_price(token_id: str) -> float:
    if token_id == "EGLD":
        try:
            e = get_json("/economics")
            return float(e.get("price") or 0)
        except Exception:
            return 0.0
    try:
        t = get_json(f"/tokens/{token_id}")
        return float(t.get("price") or 0)
    except Exception:
        return 0.0


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"positions": {}, "history": []}


def save_state(st: dict) -> None:
    STATE.write_text(json.dumps(st, indent=2))


def external_signals(egld_px: float, htm_px: float, st: dict) -> dict:
    """Build fused signal from chain economics + price momentum + GSN-style labels."""
    econ = {}
    try:
        econ = get_json("/economics")
    except Exception:
        pass
    apr = float(econ.get("apr") or 0)
    staked_ratio = 0.0
    try:
        staked_ratio = float(econ.get("staked") or 0) / max(float(econ.get("circulatingSupply") or 1), 1)
    except Exception:
        pass

    # momentum vs last snapshot
    prev = st.get("last_prices") or {}
    htm_chg = 0.0
    if prev.get("HTM-f51d55") and htm_px:
        htm_chg = (htm_px - float(prev["HTM-f51d55"])) / float(prev["HTM-f51d55"]) * 100.0

    # GSN-style external narrative (static fusion labels — board can override later)
    gsn_elite = {"id": "GSN Elite MVX", "bias": "BUY" if staked_ratio > 0.4 else "WAIT", "acc": 0.88}
    gsn_macro = {"id": "GSN Alpha Macro", "bias": "BUY" if apr and apr < 0.12 else "WAIT", "acc": 0.84}

    # price momentum leg
    mom = {"id": "HTM_momentum", "chg_pct": round(htm_chg, 4)}
    if htm_chg >= TP_PCT:
        mom["bias"] = "SELL"
        mom["conf"] = min(0.9, 0.55 + htm_chg / 10)
    elif htm_chg <= -SL_PCT:
        mom["bias"] = "BUY"  # mean-reversion micro
        mom["conf"] = 0.58
    elif htm_chg > 0.3:
        mom["bias"] = "BUY"
        mom["conf"] = 0.6
    else:
        mom["bias"] = "WAIT"
        mom["conf"] = 0.5

    # fusion
    votes = []
    for leg in (gsn_elite, gsn_macro, mom):
        b = leg.get("bias", "WAIT")
        c = float(leg.get("conf") or leg.get("acc") or 0.5)
        votes.append((b, c))

    buy_score = sum(c for b, c in votes if b == "BUY")
    sell_score = sum(c for b, c in votes if b == "SELL")
    wait_score = sum(c for b, c in votes if b == "WAIT")

    if sell_score > buy_score and sell_score >= 0.55:
        bias, conf = "SELL", min(0.95, sell_score / max(len(votes), 1) + 0.2)
    elif buy_score > wait_score and buy_score >= 0.65:
        bias, conf = "BUY", min(0.95, buy_score / max(len(votes), 1) + 0.15)
    else:
        bias, conf = "WAIT", 0.5

    return {
        "bias": bias,
        "confidence": round(conf, 3),
        "legs": {"gsn_elite": gsn_elite, "gsn_macro": gsn_macro, "momentum": mom},
        "econ": {"egld_price": egld_px, "apr": apr, "staked_ratio": round(staked_ratio, 4)},
        "htm_chg_pct": round(htm_chg, 4),
    }


def s1_preservation(egld: float, liquid: float) -> dict:
    return {
        "id": "S1_preservation",
        "reserve_ok": egld >= MIN_RESERVE,
        "risk_budget_egld": round(max(0.0, liquid) * (MAX_RISK_PCT / 100.0), 6),
        "max_trades_day": 2,
        "compound_split": {"reserve": 0.7, "sleeve": 0.3},
        "action": "ok" if egld >= MIN_RESERVE else "block_all_trades",
    }


def s2_signal_sleeve(signal: dict, s1: dict) -> dict:
    if s1["action"] == "block_all_trades":
        return {"id": "S2_signal", "action": "idle", "reason": "reserve"}
    if signal["bias"] == "WAIT" or signal["confidence"] < 0.55:
        return {"id": "S2_signal", "action": "idle", "reason": "wait_or_low_conf"}
    if signal["bias"] == "BUY" and signal["confidence"] >= 0.65:
        size = min(s1["risk_budget_egld"], 0.05)
        return {"id": "S2_signal", "action": "buy_sleeve", "size_egld": size, "token": "HTM-f51d55"}
    if signal["bias"] == "SELL":
        return {"id": "S2_signal", "action": "reduce_sleeve", "token": "HTM-f51d55"}
    return {"id": "S2_signal", "action": "idle", "reason": "no_edge"}


def s3_tro_dca(signal: dict, s1: dict, weekday: int) -> dict:
    """1–2x / week style — only if BUY and budget."""
    if s1["action"] == "block_all_trades":
        return {"id": "S3_tro_dca", "action": "idle", "reason": "reserve"}
    # Mon=0 ... allow Mon/Thu
    if weekday not in (0, 3):
        return {"id": "S3_tro_dca", "action": "idle", "reason": "not_dca_day"}
    if signal["bias"] != "BUY" or signal["confidence"] < 0.65:
        return {"id": "S3_tro_dca", "action": "idle", "reason": "signal"}
    size = min(0.05, s1["risk_budget_egld"])
    if size < 0.008:
        return {"id": "S3_tro_dca", "action": "idle", "reason": "size"}
    return {"id": "S3_tro_dca", "action": "dca_buy", "token": "TRO-94c925", "size_egld": size}


def momentum_manage(st: dict, htm_px: float, signal: dict) -> dict:
    pos = (st.get("positions") or {}).get("HTM-f51d55")
    if not pos:
        return {"id": "momentum", "action": "flat"}
    entry = float(pos.get("entry_price_usd") or 0)
    if not entry or not htm_px:
        return {"id": "momentum", "action": "hold_unknown"}
    chg = (htm_px - entry) / entry * 100.0
    if chg >= TP_PCT:
        return {"id": "momentum", "action": "take_profit", "pnl_pct": round(chg, 3)}
    if chg <= -SL_PCT:
        return {"id": "momentum", "action": "stop_loss", "pnl_pct": round(chg, 3)}
    return {"id": "momentum", "action": "hold", "pnl_pct": round(chg, 3)}


def main() -> int:
    acc = get_json(f"/accounts/{ADDR}")
    egld = int(acc.get("balance") or 0) / 1e18
    liquid = max(0.0, egld - MIN_RESERVE)

    tokens = []
    try:
        raw = get_json(f"/accounts/{ADDR}/tokens?size=30")
        tokens = raw if isinstance(raw, list) else raw.get("data") or []
    except Exception:
        pass

    holdings = {"EGLD": egld}
    for t in tokens:
        ident = t.get("identifier") or ""
        if ident in UNIVERSE or ident.startswith("HTM") or ident.startswith("TRO") or ident.startswith("ASH"):
            dec = int(t.get("decimals") or 18)
            holdings[ident] = int(t.get("balance") or 0) / (10**dec)

    egld_px = token_price("EGLD")
    htm_px = token_price("HTM-f51d55")
    st = load_state()

    signal = external_signals(egld_px, htm_px, st)
    s1 = s1_preservation(egld, liquid)
    s2 = s2_signal_sleeve(signal, s1)
    s3 = s3_tro_dca(signal, s1, datetime.now(timezone.utc).weekday())
    mom = momentum_manage(st, htm_px, signal)

    # priority: manage open risk → S2 → S3
    plan = []
    if mom["action"] in ("take_profit", "stop_loss"):
        plan.append({"priority": 0, **mom, "live_allowed": LIVE and MODE == "live"})
    if s2["action"] not in ("idle",):
        plan.append({"priority": 1, **s2, "live_allowed": LIVE and MODE == "live" and s1["action"] == "ok"})
    if s3["action"] not in ("idle",):
        plan.append({"priority": 2, **s3, "live_allowed": LIVE and MODE == "live" and s1["action"] == "ok"})
    if not plan:
        plan.append({"priority": 9, "action": "idle", "reason": "all_strategies_quiet"})

    report = {
        "agent": "GrokyversX",
        "ts": datetime.now(timezone.utc).isoformat(),
        "address": ADDR,
        "mode": MODE,
        "live_flag": LIVE,
        "holdings": holdings,
        "egld": round(egld, 6),
        "liquid_egld": round(liquid, 6),
        "prices": {"EGLD": egld_px, "HTM-f51d55": htm_px},
        "signal": signal,
        "strategies": {"S1": s1, "S2": s2, "S3": s3, "momentum": mom},
        "plan": plan,
        "message": (
            "Unified LIA S1/S2/S3 + momentum + GSN-style external legs. "
            "No TX in paper. Live requires explicit GROK_LIVE_TRADING=1 + swap/Hatom routes."
        ),
    }

    st["last_prices"] = {"EGLD": egld_px, "HTM-f51d55": htm_px}
    st["last_report"] = report
    st.setdefault("history", []).append({"ts": report["ts"], "bias": signal["bias"], "plan": plan[0].get("action")})
    st["history"] = st["history"][-50:]
    save_state(st)

    out = DATA / f"unified_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    out.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
