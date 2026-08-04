"""Daily Claude cycle — auto_execute=False by default."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Callable, Optional

from lia.claude_agent.decision_engine import ClaudeCallFn, TradeProposal, get_daily_proposal
from lia.claude_agent.trade_lock import LockHeldByOther, TradeLock

AGENT_OWNER = "claude-daily-advisor"
ExecuteFn = Callable[[TradeProposal], dict]


def _append_journal(journal_path: Path, entry: dict) -> None:
    journal_path.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if journal_path.exists():
        try:
            history = json.loads(journal_path.read_text(encoding="utf-8"))
            if not isinstance(history, list):
                history = []
        except json.JSONDecodeError:
            history = []
    history.append(entry)
    journal_path.write_text(json.dumps(history, indent=2), encoding="utf-8")


def run_daily_cycle(
    market_context: str,
    call_claude: ClaudeCallFn,
    lock_path: Path,
    journal_path: Path,
    execute_fn: Optional[ExecuteFn] = None,
    auto_execute: bool = False,
    min_confidence_to_act: float = 60.0,
    now: Optional[float] = None,
) -> dict:
    now = time.time() if now is None else now
    proposal = get_daily_proposal(market_context, call_claude, min_confidence_to_act)
    if proposal is None:
        entry = {
            "timestamp": now,
            "status": "no_proposal",
            "reason": "advisor call failed or returned invalid output",
            "executed": False,
        }
        _append_journal(journal_path, entry)
        return entry

    entry = {
        "timestamp": now,
        "status": "proposed",
        "proposal": proposal.to_dict(),
        "executed": False,
        "execution_result": None,
        "execution_skipped_reason": None,
    }

    should_attempt = (
        auto_execute and proposal.action in ("BUY", "SELL") and execute_fn is not None
    )
    if not should_attempt:
        if proposal.action in ("BUY", "SELL") and not auto_execute:
            entry["execution_skipped_reason"] = "auto_execute is disabled (advisor-only mode)"
        _append_journal(journal_path, entry)
        return entry

    lock = TradeLock(lock_path, owner=AGENT_OWNER, ttl_seconds=120)
    try:
        lock.acquire(now=now)
    except LockHeldByOther as e:
        entry["execution_skipped_reason"] = f"lock held by '{e.holder}' — skipping this cycle"
        _append_journal(journal_path, entry)
        return entry

    try:
        result = execute_fn(proposal)
        entry["executed"] = True
        entry["execution_result"] = result
    except Exception as e:
        entry["execution_skipped_reason"] = f"execution failed: {e}"
    finally:
        lock.release()

    _append_journal(journal_path, entry)
    return entry
