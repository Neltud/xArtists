"""Desk debate pure logic — no network."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lia.circuit.desk_debate import debate


def test_risk_off_veto():
    v = debate(gs_regime="RISK_OFF", price_change_1h=0.05, volume_spike=2.0)
    assert v.risk_veto is True
    assert v.action in ("HOLD", "YIELD")


def test_bull_path():
    v = debate(
        price=3.0,
        vwap_24h=2.9,
        rsi_14=55,
        price_change_1h=0.02,
        price_change_24h=0.05,
        volume_spike=1.5,
        gs_bias="BULLISH",
        fear_greed=55,
        drawdown=0.02,
    )
    assert v.risk_veto is False
    assert v.net_score > 0 or v.action in ("BUY", "HOLD", "YIELD")


def test_drawdown_veto():
    v = debate(drawdown=0.15, gs_bias="BULLISH", price_change_1h=0.03)
    assert v.risk_veto is True


def test_to_dict():
    d = debate().to_dict()
    assert d["paper"] is True
    assert "roles" in d
    assert len(d["roles"]) >= 5


if __name__ == "__main__":
    test_risk_off_veto()
    test_bull_path()
    test_drawdown_veto()
    test_to_dict()
    print("OK desk_debate")
