"""Publish data/lia_board.json — positions, feeds, arb, series, risk."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from lia.board.arb import scan_block_arb
from lia.board.positions import fetch_wallet_snapshot
from lia.board.risk import DEFAULT_LIMITS
from lia.board.series import run_three_series
from lia.venues.onchain_feeds import all_placement_feeds

ROOT = Path(__file__).resolve().parents[2]


def build_board(
    *,
    series_start: float = 10.0,
    series_days: int = 30,
    token: str = "WEGLD-bd4d79",
) -> dict[str, Any]:
    feeds = all_placement_feeds(token=token)
    positions = fetch_wallet_snapshot()
    series = run_three_series(start_usd=series_start, days=series_days, include_all=True)
    arb = scan_block_arb(token=token, feeds=feeds, trades_today=0)
    return {
        "version": "1.1",
        "board": "lia_xboard",
        "risk": DEFAULT_LIMITS.to_dict(),
        "feeds": feeds,
        "positions": positions,
        "series": series,
        "arb": arb,
        "trades": {
            "past": [],
            "open": [],
            "planned": [],
            "note": "Fill from compound/executor when LIA_LIVE_TRADING=1",
        },
        "venues_used_by_lia": [
            "xexchange",
            "onedex",
            "jexchange",
            "ashswap",
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
