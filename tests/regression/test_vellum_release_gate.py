"""Regression: Vellum release gate stays fail-closed until paper/publication steps pass."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lia.vellum.production_run import phase_priority_gate  # noqa: E402


def test_priority_gate_blocks_live_trading_env():
    gate = phase_priority_gate(
        {
            "CHAIN": "1",
            "LIA_LIVE_TRADING": "1",
            "phases": {
                "gates": {"ok": True},
                "pipeline": {"ok": True},
                "commander_refresh": {"ok": True},
                "mirror": {"ok": True},
            },
        }
    )
    assert gate["ok"] is False
    assert any("LIA_LIVE_TRADING" in msg for msg in gate["blockers"])


def test_priority_gate_passes_after_paper_and_publication():
    gate = phase_priority_gate(
        {
            "CHAIN": "1",
            "LIA_LIVE_TRADING": "0",
            "phases": {
                "gates": {"ok": True},
                "pipeline": {"ok": True},
                "commander_refresh": {"ok": True},
                "mirror": {"ok": True},
            },
        }
    )
    assert gate["ok"] is True
    assert gate["operator"] == "vellum"
    assert gate["strict_sequence"][0] == "paper_cycle"
