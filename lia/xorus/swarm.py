"""Xorus public API. Compatible facade over the historical Chorus paper engine."""
from __future__ import annotations

import json
from typing import Any, Optional

from lia.chorus.swarm import run_chorus


def run_xorus(*, market: Optional[dict[str, Any]] = None, chatgpt_brief: Any = None) -> dict[str, Any]:
    """Run the paper-only swarm; never authorize execution by renaming it."""
    board = run_chorus(market=market, chatgpt_brief=chatgpt_brief)
    board["engine"] = "xorus"
    board["legacy_engine"] = "chorus"
    board["live_locked"] = True
    board["live_trading"] = False
    if isinstance(board.get("crosscut"), dict):
        board["crosscut"]["executable"] = False
        board["crosscut"]["live_trading"] = False
    handoff = board.get("handoff_for_chatgpt")
    if isinstance(handoff, str) and handoff.startswith("CHORUS →"):
        board["handoff_for_chatgpt"] = "XORUS →" + handoff[len("CHORUS →"):]
    return board


def main() -> None:
    print(json.dumps(run_xorus(), indent=2, ensure_ascii=False))
