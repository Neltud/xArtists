#!/usr/bin/env python3
"""Grok-owned wallet — ESDT momentum cycle (paper default).

Buy any priced ESDT (e.g. HTM), exit +1.7% / stop -1%.
New trading column when liquid equity unlocks.
No Vellum. Live TX not signed in this script (needs PEM + swap router).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from strategies.momentum_esdt import (  # noqa: E402
    MomentumConfig,
    apply_paper,
    columns_for_equity,
    decide,
    snapshot_columns,
)

API = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")
ADDR = (os.environ.get("GROK_WALLET_ADDRESS") or "").strip()
TOKEN = (os.environ.get("GROK_FOCUS_TOKEN") or "HTM-f51d55").strip()
MODE = (os.environ.get("GROK_MODE") or "paper").lower()
LIVE = (os.environ.get("GROK_LIVE_TRADING") or "0").strip() == "1"
MIN_RESERVE = float(os.environ.get("GROK_MIN_EGLD_RESERVE") or "0.15")
# optional force bias for test: BUY|WAIT
FORCE_BIAS = (os.environ.get("GROK_FORCE_BIAS") or "").upper().strip()
FORCE_CONF = float(os.environ.get("GROK_FORCE_CONF") or "0.6")

STATE_PATH = ROOT / "data" / "momentum_state.json"
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)


def get_json(path: str):
    req = urllib.request.Request(f"{API}{path}", headers={"User-Agent": "xArtists-grok-momentum/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def token_price_usd(token_id: str) -> float:
    try:
        t = get_json(f"/tokens/{token_id}")
        p = t.get("price")
        return float(p) if p is not None else 0.0
    except Exception:
        return 0.0


def egld_price_usd() -> float:
    try:
        t = get_json("/tokens/EGLD-000000")
        p = t.get("price")
        if p:
            return float(p)
    except Exception:
        pass
    try:
        # fallback economics
        e = get_json("/economics")
        p = (e.get("data") or e).get("price") or (e.get("data") or e).get("egldPrice")
        return float(p or 0)
    except Exception:
        return 0.0


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"columns": [], "history": []}


def main() -> int:
    if not ADDR.startswith("erd1"):
        print("Set GROK_WALLET_ADDRESS", file=sys.stderr)
        return 2

    acc = get_json(f"/accounts/{ADDR}")
    egld = int(acc.get("balance") or 0) / 1e18
    liquid = max(0.0, egld - MIN_RESERVE)
    cfg = MomentumConfig()
    cols = columns_for_equity(liquid, cfg)

    state = load_state()
    # restore positions by column id if present
    prev = {c["id"]: c for c in state.get("columns") or [] if isinstance(c, dict)}
    from strategies.momentum_esdt import Position, Column

    restored: list = []
    for c in cols:
        old = prev.get(c.id)
        if old and old.get("position"):
            p = old["position"]
            c.position = Position(
                token=p["token"],
                entry_price_usd=float(p["entry_price_usd"]),
                size_egld=float(p["size_egld"]),
                qty_token=float(p["qty_token"]),
                opened_ts=p.get("opened_ts") or "",
            )
            c.realized_pnl_egld = float(old.get("realized_pnl_egld") or 0)
            c.trades = list(old.get("trades") or [])
        restored.append(c)

    price = token_price_usd(TOKEN)
    egld_px = egld_price_usd()
    bias = FORCE_BIAS if FORCE_BIAS in ("BUY", "SELL", "WAIT", "LONG") else "WAIT"
    conf = FORCE_CONF if FORCE_BIAS else 0.5

    ts = datetime.now(timezone.utc).isoformat()
    decisions = []
    for c in restored:
        d = decide(
            token=TOKEN,
            price_usd=price,
            egld_usd=egld_px or 1.0,
            column=c,
            cfg=cfg,
            bias=bias if bias != "SELL" else "WAIT",
            confidence=conf,
        )
        if MODE == "paper":
            apply_paper(c, d, ts)
        elif MODE == "live" and LIVE:
            d["live_note"] = "Signing not enabled in this environment — paper apply only"
            apply_paper(c, d, ts)
        decisions.append({"column": c.id, **d})

    report = {
        "agent": "grok-momentum-esdt",
        "owner": "grok",
        "ts": ts,
        "address": ADDR,
        "mode": MODE,
        "live_flag": LIVE,
        "egld": round(egld, 6),
        "liquid_egld": round(liquid, 6),
        "columns_n": len(restored),
        "focus_token": TOKEN,
        "token_price_usd": price,
        "egld_price_usd": egld_px,
        "decisions": decisions,
        "columns": snapshot_columns(restored),
        "message": (
            "Paper momentum cycle. Live swaps require PEM + xExchange route on ops host."
        ),
    }

    # persist full column trades for next run
    persist_cols = []
    for c in restored:
        snap = {
            "id": c.id,
            "label": c.label,
            "budget_egld": c.budget_egld,
            "realized_pnl_egld": c.realized_pnl_egld,
            "position": None
            if not c.position
            else {
                "token": c.position.token,
                "entry_price_usd": c.position.entry_price_usd,
                "size_egld": c.position.size_egld,
                "qty_token": c.position.qty_token,
                "opened_ts": c.position.opened_ts,
            },
            "trades": c.trades[-20:],
        }
        persist_cols.append(snap)
    STATE_PATH.write_text(json.dumps({"columns": persist_cols, "last": report}, indent=2))

    out = DATA / f"momentum_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    out.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
