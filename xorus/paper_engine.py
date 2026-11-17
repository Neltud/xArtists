"""xOrus paper engine — LIA-free API surface.

During phase 1 the scoring implementation is still the historical Chorus paper
scorer (no live trading, executable=false). The public import path is xorus.*
only; callers must not use lia.vellum.

A fully inlined copy of the scorer (no lia.chorus import) is staged for the
next commit once CI confirms the package layout.
"""
from __future__ import annotations

from typing import Any, Optional

# Bridge: paper-only scorer. Never enables live trading.
from lia.chorus.swarm import CHATGPT_CAP, LIVE_LOCKED, ROLES  # noqa: F401
from lia.chorus.swarm import run_chorus as _run_chorus


def run_paper(
    *,
    market: Optional[dict[str, Any]] = None,
    chatgpt_brief: Any = None,
) -> dict[str, Any]:
    board = _run_chorus(market=market, chatgpt_brief=chatgpt_brief)
    board["engine"] = "xorus"
    board["legacy_engine"] = "chorus"
    board["lia_retired"] = True
    board["live_trading"] = False
    board["live_locked"] = True
    if isinstance(board.get("crosscut"), dict):
        board["crosscut"]["executable"] = False
        board["crosscut"]["live_trading"] = False
    return board
