#!/usr/bin/env python3
"""Grok Daily Trader — one cycle (paper by default).

Reads MultiversX account via public API, applies compounding gates,
writes a journal entry. Live swaps are NOT implemented here without
explicit PEM + GROK_LIVE_TRADING=1 (stub only).

Usage:
  python scripts/daily_cycle.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

API = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")
MODE = (os.environ.get("GROK_MODE") or "paper").lower()
LIVE = (os.environ.get("GROK_LIVE_TRADING") or "0").strip() == "1"
ADDR = (os.environ.get("GROK_WALLET_ADDRESS") or "").strip()
MIN_RESERVE = float(os.environ.get("GROK_MIN_EGLD_RESERVE") or "1.5")
MAX_RISK_PCT = float(os.environ.get("GROK_MAX_RISK_PCT") or "5")

# Default LIA ops if no dedicated address set (read-only observation)
DEFAULT_LIA = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

UNIVERSE = {"EGLD", "TRO-94c925", "ASH-a642d1"}


def get_json(path: str):
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"User-Agent": "xArtists-grok-daily-trader/1.0"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def main() -> int:
    address = ADDR or DEFAULT_LIA
    if not address.startswith("erd1"):
        print("Invalid GROK_WALLET_ADDRESS", file=sys.stderr)
        return 2

    acc = get_json(f"/accounts/{address}")
    egld = int(acc.get("balance") or 0) / 1e18

    tokens = []
    try:
        toks = get_json(f"/accounts/{address}/tokens?size=50")
        if isinstance(toks, list):
            tokens = toks
        elif isinstance(toks, dict):
            tokens = toks.get("data") or toks.get("tokens") or []
    except Exception as e:
        print(f"tokens fetch soft-fail: {e}", file=sys.stderr)

    tradable = []
    ignored = []
    for t in tokens:
        ident = t.get("identifier") or t.get("ticker") or ""
        if ident in UNIVERSE or ident.split("-")[0] in ("TRO", "ASH"):
            if ident in UNIVERSE:
                tradable.append({"id": ident, "balance": t.get("balance")})
            else:
                ignored.append(ident)
        else:
            ignored.append(ident)

    liquid_egld = max(0.0, egld - MIN_RESERVE)
    risk_budget_egld = liquid_egld * (MAX_RISK_PCT / 100.0)

    # Signal policy: without external board feed, default WAIT (safe)
    signal = {
        "bias": "WAIT",
        "confidence": 0.5,
        "source": "grok-daily-default",
        "note": "Connect LIA board / GSN feed for live bias; default idle",
    }

    action = "idle"
    if signal["bias"] == "WAIT" or signal["confidence"] < 0.55:
        action = "idle_wait"
    elif MODE == "live" and LIVE and liquid_egld > 0.05:
        action = "live_stub_not_executed"
    elif MODE == "paper":
        action = "paper_simulate_skip_wait"

    report = {
        "agent": "grok-daily-trader",
        "ts": datetime.now(timezone.utc).isoformat(),
        "address": address,
        "mode": MODE,
        "live_flag": LIVE,
        "egld": round(egld, 6),
        "min_reserve": MIN_RESERVE,
        "liquid_egld": round(liquid_egld, 6),
        "risk_budget_egld": round(risk_budget_egld, 6),
        "tradable": tradable,
        "ignored_count": len(ignored),
        "signal": signal,
        "action": action,
        "tx": None,
        "message": (
            "Paper cycle OK — no chain TX."
            if action.startswith("idle") or action.startswith("paper")
            else "Live requested but swap execution requires ops PEM integration."
        ),
    }

    out = DATA / f"journal_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
    # append-style: write daily file (overwrite same day consolidates last run)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"\nWrote {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
