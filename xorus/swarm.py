"""xOrus paper swarm — canonical board runner.

During migration this may still call the historical Chorus scorer when present.
If Chorus is absent, returns a sealed ABSTAIN / thin_tape board. Never executes.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from xorus.safety import SAFETY, seal


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _abstain_board(*, reason: str = "thin_tape") -> dict[str, Any]:
    return seal(
        {
            "schema": "xorus_board/v1",
            "generated_at": _now(),
            "decision": "ABSTAIN",
            "reason": reason,
            "defined_signals": int(SAFETY["defined_signals"]),
            "analyzed_signals": 0,
            "families_fed": 0,
            "legacy_engine": None,
            "note": "xOrus paper backend — no LIA execution path.",
        }
    )


def run_xorus(
    *,
    market: Optional[dict[str, Any]] = None,
    chatgpt_brief: Any = None,
    grok_note: Any = None,
) -> dict[str, Any]:
    """Run one paper-only decision cycle.

    Optional external briefs are advisory only. ChatGPT weight is capped in the
    safety contract; Sentinel always retains veto (executable stays false).
    """
    board: dict[str, Any]
    try:
        # Temporary bridge: historical paper scorer if still in-tree.
        from lia.chorus.swarm import run_chorus  # type: ignore

        board = run_chorus(market=market, chatgpt_brief=chatgpt_brief)
        board["legacy_engine"] = "chorus"
    except Exception:
        board = _abstain_board(reason="scorer_unavailable_or_thin_tape")

    board["engine"] = "xorus"
    board["lia_retired"] = True
    board["generated_at"] = board.get("generated_at") or _now()

    if grok_note is not None:
        board["external"] = dict(board.get("external") or {})
        board["external"]["grok_note"] = grok_note
    if chatgpt_brief is not None:
        board.setdefault("external", {})
        board["external"]["chatgpt_brief"] = chatgpt_brief
        board["external"]["chatgpt_weight_cap"] = SAFETY["chatgpt_weight_cap"]

    handoff = board.get("handoff_for_chatgpt")
    if isinstance(handoff, str) and handoff.startswith("CHORUS →"):
        board["handoff_for_chatgpt"] = "xOrus →" + handoff[len("CHORUS →") :]

    return seal(board)


def main() -> None:
    print(json.dumps(run_xorus(), indent=2, ensure_ascii=False))
