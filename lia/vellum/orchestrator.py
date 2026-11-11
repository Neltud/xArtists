"""Retired. Vellum no longer runs this pipeline.

`run_orchestrator` delegates to Chorus and never signs.
The rest of lia/vellum is frozen legacy. Do not add new nodes.
"""
from __future__ import annotations

from typing import Any, Optional


def env_bootstrap() -> dict[str, Any]:
    return {
        "chain_id": "1",
        "live_trading": False,
        "engine": "chorus",
        "vellum": "retired",
    }


def run_orchestrator(
    *,
    market: Optional[dict[str, Any]] = None,
    publish: bool = False,
    compound_demo: bool = False,
    portfolio: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    del publish, compound_demo, portfolio
    from lia.chorus.swarm import run_chorus

    board = run_chorus(market=market)
    return {
        "ts": board["ts"],
        "engine": "chorus",
        "vellum": "retired",
        "bootstrap": env_bootstrap(),
        "live_trading": False,
        "executor": {"live": False, "note": "Chorus paper only — no PEM"},
        "guardian": {"allow": False, "reason": "chorus_no_execution"},
        "agent": {"action": "WAIT", "executable": False},
        "board": board,
    }


if __name__ == "__main__":
    import json

    print(json.dumps(run_orchestrator(), indent=2)[:2000])
