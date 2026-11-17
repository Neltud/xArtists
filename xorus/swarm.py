"""xOrus public API — paper swarm over the in-tree paper_engine (no LIA)."""
from __future__ import annotations

import json
from typing import Any, Optional

from xorus.paper_engine import run_paper
from xorus.safety import seal


def run_xorus(
    *,
    market: Optional[dict[str, Any]] = None,
    chatgpt_brief: Any = None,
    grok_note: Any = None,
) -> dict[str, Any]:
    """Run the paper-only swarm; never authorize execution."""
    board = run_paper(market=market, chatgpt_brief=chatgpt_brief)
    board["engine"] = "xorus"
    board["legacy_engine"] = "chorus_scorer"
    board["lia_retired"] = True
    if grok_note is not None:
        board.setdefault("external", {})
        board["external"]["grok_note"] = grok_note
    if chatgpt_brief is not None:
        board.setdefault("external", {})
        board["external"]["chatgpt_brief"] = chatgpt_brief
    return seal(board)


def main() -> None:
    print(json.dumps(run_xorus(), indent=2, ensure_ascii=False))
