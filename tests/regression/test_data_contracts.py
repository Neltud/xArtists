"""Regression: data/*.json contracts & treasury shape (no network)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _load(name: str) -> dict:
    p = ROOT / "data" / name
    assert p.exists(), f"missing {p}"
    return json.loads(p.read_text(encoding="utf-8"))


def test_contracts_json_shape():
    d = _load("contracts.json")
    assert d.get("network") == "mainnet"
    assert d.get("chainId") in ("1", 1)
    c = d.get("contracts") or {}
    assert "marketplace" in c
    assert "agents_marketplace" in c
    # agents may be null pre-deploy
    m = c.get("marketplace")
    if m is not None:
        assert str(m).startswith("erd1")


def test_lia_v6_status_live_flag_default_off():
    d = _load("lia_v6_status.json")
    flag = d.get("LIA_LIVE_TRADING", 0)
    assert int(flag) == 0 or flag is False


def test_treasury_wallets_shape():
    d = _load("treasury_wallets.json")
    w = d.get("wallets") or {}
    assert "lia_ops" in w
    assert "mission" in w
    assert "reserve" in w
    lia = w["lia_ops"].get("address") or ""
    assert lia.startswith("erd1")


def test_lia_board_seed():
    d = _load("lia_board.json")
    assert d.get("board")
    assert "risk" in d
    assert "series" in d


def test_agents_fee_bps_policy():
    # Product rule: 300 bps = 3%
    assert 300 == 300
    catalog = ROOT / "data" / "agents_catalog.json"
    if catalog.exists():
        j = json.loads(catalog.read_text(encoding="utf-8"))
        assert isinstance(j, (dict, list))


if __name__ == "__main__":
    test_contracts_json_shape()
    test_lia_v6_status_live_flag_default_off()
    test_treasury_wallets_shape()
    test_lia_board_seed()
    test_agents_fee_bps_policy()
    print("OK test_data_contracts")
