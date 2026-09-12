#!/usr/bin/env python3
"""GrokyversX unified strategies — POLICY.md

- NO TRO DCA
- DCA lending: USDC / EGLD / wTAO / WBTC
- HTM -> Booster only (not lending), claim + compound stake
- Swaps any ESDT with min 1% edge
- Rank by market cap + social proxy (volume, accounts)
"""
from __future__ import annotations

import json
import math
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")
ADDR = (os.environ.get("GROK_WALLET_ADDRESS") or
        "erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl").strip()
MODE = (os.environ.get("GROK_MODE") or "paper").lower()
LIVE = (os.environ.get("GROK_LIVE_TRADING") or "0").strip() == "1"
MIN_RESERVE = float(os.environ.get("GROK_MIN_EGLD_RESERVE") or "0.15")
MAX_RISK_PCT = float(os.environ.get("GROK_MAX_RISK_PCT") or "5")
# min edge for swap TP / signal move
MIN_EDGE_PCT = float(os.environ.get("GROK_MIN_EDGE_PCT") or "1.0")
SL_PCT = float(os.environ.get("GROK_SL_PCT") or "1.0")

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)
STATE = DATA / "unified_state.json"

# Lending DCA targets (Hatom) — NEVER TRO
LENDING_DCA = [
    {"id": "USDC-c76f1f", "symbol": "USDC", "market_key": "USDC"},
    {"id": "EGLD", "symbol": "EGLD", "market_key": "EGLD"},
    {"id": "WTAO-4f5363", "symbol": "wTAO", "market_key": "wTAO"},  # verify id on chain
    {"id": "WBTC-49ca31", "symbol": "WBTC", "market_key": "WBTC"},
]

# Banned from DCA
NO_DCA = {"TRO-94c925", "TRO"}


def get_json(path: str):
    req = urllib.request.Request(f"{API}{path}", headers={"User-Agent": "GrokyversX-unified/2.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def token_meta(token_id: str) -> dict:
    if token_id == "EGLD":
        e = get_json("/economics")
        return {
            "identifier": "EGLD",
            "price": float(e.get("price") or 0),
            "marketCap": float(e.get("marketCap") or e.get("tokenMarketCap") or 0),
            "accounts": 0,
            "transactions": 0,
            "volume": 0,
        }
    try:
        t = get_json(f"/tokens/{token_id}")
        return {
            "identifier": t.get("identifier") or token_id,
            "price": float(t.get("price") or 0),
            "marketCap": float(t.get("marketCap") or 0),
            "accounts": int(t.get("accounts") or 0),
            "transactions": int(t.get("transactions") or 0),
            "volume": float(t.get("volume") or t.get("volume24h") or 0),
        }
    except Exception:
        return {"identifier": token_id, "price": 0, "marketCap": 0, "accounts": 0, "transactions": 0, "volume": 0}


def social_mcap_score(meta: dict) -> float:
    """Higher = more presence. Pure on-chain proxies (no X scrape)."""
    mcap = max(float(meta.get("marketCap") or 0), 0)
    vol = max(float(meta.get("volume") or 0), 0)
    acc = max(int(meta.get("accounts") or 0), 0)
    tx = max(int(meta.get("transactions") or 0), 0)
    return (
        0.45 * math.log10(1 + mcap)
        + 0.25 * math.log10(1 + vol)
        + 0.20 * math.log10(1 + acc)
        + 0.10 * math.log10(1 + tx)
    )


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"positions": {}, "history": [], "last_prices": {}}


def save_state(st: dict) -> None:
    STATE.write_text(json.dumps(st, indent=2))


def rank_lending_targets() -> list:
    ranked = []
    for t in LENDING_DCA:
        if t["id"] in NO_DCA or t["symbol"].upper() == "TRO":
            continue
        meta = token_meta(t["id"] if t["id"] != "EGLD" else "EGLD")
        # try alternate wTAO ids if price 0
        if t["symbol"] == "wTAO" and not meta.get("price"):
            for alt in ("WTAO-4f5363", "WTAO-27de5f", "wTAO-4f5363"):
                meta = token_meta(alt)
                if meta.get("price"):
                    t = {**t, "id": meta["identifier"]}
                    break
        score = social_mcap_score(meta)
        ranked.append({**t, "meta": meta, "score": round(score, 4)})
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked


def s1_preservation(egld: float, liquid: float) -> dict:
    return {
        "id": "S1_preservation",
        "reserve_ok": egld >= MIN_RESERVE,
        "risk_budget_egld": round(max(0.0, liquid) * (MAX_RISK_PCT / 100.0), 6),
        "action": "ok" if egld >= MIN_RESERVE else "block_all_trades",
    }


def s_booster_htm(holdings: dict, s1: dict) -> dict:
    """HTM only to Booster — never lending mint."""
    htm = float(holdings.get("HTM-f51d55") or 0)
    if s1["action"] != "ok":
        return {"id": "HTM_booster", "action": "idle", "reason": "reserve"}
    if htm <= 0:
        return {"id": "HTM_booster", "action": "idle", "reason": "no_htm"}
    return {
        "id": "HTM_booster",
        "action": "stake_booster",
        "token": "HTM-f51d55",
        "amount": htm,
        "note": "Booster only — not Hatom HTM money market",
        "follow_up": ["claim_htm_rewards", "compound_stake_booster"],
    }


def s_lending_dca(ranked: list, s1: dict, weekday: int, signal_bias: str, conf: float) -> dict:
    if s1["action"] != "ok":
        return {"id": "lending_dca", "action": "idle", "reason": "reserve"}
    # Mon/Thu
    if weekday not in (0, 3):
        return {"id": "lending_dca", "action": "idle", "reason": "not_dca_day"}
    if signal_bias not in ("BUY", "LONG") or conf < 0.55:
        return {"id": "lending_dca", "action": "idle", "reason": "signal"}
    if not ranked:
        return {"id": "lending_dca", "action": "idle", "reason": "no_targets"}
    top = ranked[0]
    size = min(s1["risk_budget_egld"], 0.05)
    if size < 0.008:
        return {"id": "lending_dca", "action": "idle", "reason": "size"}
    return {
        "id": "lending_dca",
        "action": "supply_lending",
        "token": top["id"],
        "symbol": top["symbol"],
        "score": top["score"],
        "mcap": top["meta"].get("marketCap"),
        "size_egld": size,
        "forbidden": list(NO_DCA),
    }


def s_swap_momentum(st: dict, focus: str, price: float) -> dict:
    pos = (st.get("positions") or {}).get(focus)
    if not pos or not price:
        return {"id": "swap_momentum", "action": "flat", "min_edge_pct": MIN_EDGE_PCT}
    entry = float(pos.get("entry_price_usd") or 0)
    if not entry:
        return {"id": "swap_momentum", "action": "hold_unknown"}
    chg = (price - entry) / entry * 100.0
    if chg >= MIN_EDGE_PCT:
        return {"id": "swap_momentum", "action": "sell", "reason": "tp", "pnl_pct": round(chg, 3), "min_edge_pct": MIN_EDGE_PCT}
    if chg <= -SL_PCT:
        return {"id": "swap_momentum", "action": "sell", "reason": "sl", "pnl_pct": round(chg, 3)}
    if abs(chg) < MIN_EDGE_PCT:
        return {"id": "swap_momentum", "action": "hold_noise", "pnl_pct": round(chg, 3), "min_edge_pct": MIN_EDGE_PCT}
    return {"id": "swap_momentum", "action": "hold", "pnl_pct": round(chg, 3)}


def fuse_signal(ranked: list, egld_px: float) -> dict:
    econ = {}
    try:
        econ = get_json("/economics")
    except Exception:
        pass
    apr = float(econ.get("apr") or 0)
    # prefer high score assets environment
    top_score = ranked[0]["score"] if ranked else 0
    gsn = {
        "elite_mvx": {"bias": "BUY" if top_score > 2 else "WAIT", "acc": 0.88},
        "alpha_macro": {"bias": "BUY" if apr and apr < 0.15 else "WAIT", "acc": 0.84},
    }
    buy = sum(v["acc"] for v in gsn.values() if v["bias"] == "BUY")
    wait = sum(v["acc"] for v in gsn.values() if v["bias"] == "WAIT")
    if buy > wait and buy >= 0.8:
        bias, conf = "BUY", min(0.9, buy / 2)
    else:
        bias, conf = "WAIT", 0.5
    return {"bias": bias, "confidence": round(conf, 3), "gsn": gsn, "egld_price": egld_px, "top_lending_score": top_score}


def main() -> int:
    acc = get_json(f"/accounts/{ADDR}")
    egld = int(acc.get("balance") or 0) / 1e18
    liquid = max(0.0, egld - MIN_RESERVE)

    holdings = {"EGLD": egld}
    try:
        toks = get_json(f"/accounts/{ADDR}/tokens?size=40")
        for t in (toks if isinstance(toks, list) else []):
            ident = t.get("identifier") or ""
            dec = int(t.get("decimals") or 18)
            holdings[ident] = int(t.get("balance") or 0) / (10**dec)
    except Exception:
        pass

    st = load_state()
    ranked = rank_lending_targets()
    egld_px = token_meta("EGLD")["price"]
    htm_meta = token_meta("HTM-f51d55")
    signal = fuse_signal(ranked, egld_px)

    s1 = s1_preservation(egld, liquid)
    booster = s_booster_htm(holdings, s1)
    dca = s_lending_dca(ranked, s1, datetime.now(timezone.utc).weekday(), signal["bias"], signal["confidence"])
    swap = s_swap_momentum(st, "HTM-f51d55", float(htm_meta.get("price") or 0))

    plan = []
    if swap["action"] == "sell":
        plan.append({"priority": 0, **swap, "live_allowed": LIVE and MODE == "live"})
    if booster["action"] == "stake_booster":
        plan.append({"priority": 1, **booster, "live_allowed": False, "reason_live": "resolve booster SC first"})
    if dca["action"] == "supply_lending":
        plan.append({"priority": 2, **dca, "live_allowed": LIVE and MODE == "live"})
    if not plan:
        plan.append({"priority": 9, "action": "idle", "reason": "no_edge_or_wait"})

    report = {
        "agent": "GrokyversX",
        "policy": "no_TRO_dca | lending_USDC_EGLD_wTAO_WBTC | HTM_booster_only | swap_min_1pct | mcap_social",
        "ts": datetime.now(timezone.utc).isoformat(),
        "address": ADDR,
        "mode": MODE,
        "live_flag": LIVE,
        "holdings": holdings,
        "signal": signal,
        "lending_rank": [{"symbol": r["symbol"], "id": r["id"], "score": r["score"], "mcap": r["meta"].get("marketCap")} for r in ranked],
        "strategies": {
            "S1": s1,
            "HTM_booster": booster,
            "lending_dca": dca,
            "swap_momentum": swap,
        },
        "plan": plan,
        "forbidden_dca": list(NO_DCA),
        "min_edge_pct": MIN_EDGE_PCT,
    }

    st["last_prices"] = {"EGLD": egld_px, "HTM-f51d55": htm_meta.get("price")}
    st["last_report"] = {"ts": report["ts"], "plan": plan[0].get("action"), "bias": signal["bias"]}
    st.setdefault("history", []).append(st["last_report"])
    st["history"] = st["history"][-50:]
    save_state(st)

    out = DATA / f"unified_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    out.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
