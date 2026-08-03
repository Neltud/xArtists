"""Publish data/lia_board.json for dApp + Vellum."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from lia.board.arb import scan_micro_arb
from lia.board.positions import fetch_wallet_snapshot
from lia.board.series import run_three_series

ROOT = Path(__file__).resolve().parents[2]


def build_board(
    *,
    series_start: float = 10.0,
    series_days: int = 30,
) -> dict[str, Any]:
    positions = fetch_wallet_snapshot()
    series = run_three_series(start_usd=series_start, days=series_days)
    arb = scan_micro_arb()
    # Trade board skeleton — filled by LiveCycle/executor logs later
    trades = {
        "past": [],
        "open": [],
        "planned": [],
        "note": "Populate from lia compound tickets + executor fills when LIVE",
    }
    return {
        "version": "1.0",
        "board": "lia_xboard",
        "positions": positions,
        "series": series,
        "arb": arb,
        "trades": trades,
        "venues_used_by_lia": [
            "xexchange",
            "onedex",
            "hatom",
            "xoxno",
            "soul_experimental",
        ],
    }


def publish(**kwargs: Any) -> Path:
    data = build_board(**kwargs)
    path = ROOT / "data" / "lia_board.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    for rel in (
        "apps/frontend/public/data/lia_board.json",
        "docs/data/lia_board.json",
        "public/data/lia_board.json",
    ):
        dest = ROOT / rel
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return path


if __name__ == "__main__":
    print("wrote", publish())
