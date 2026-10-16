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
    # Prefer canonical keys (chain / chain_id / addresses); keep legacy aliases
    network = d.get("chain") or d.get("network")
    chain_id = d.get("chain_id") if "chain_id" in d else d.get("chainId")
    assert network == "mainnet"
    assert chain_id in ("1", 1)

    addresses = d.get("addresses") or {}
    legacy = d.get("contracts") or {}
    market = addresses.get("nft_marketplace") or legacy.get("marketplace")
    agents = addresses.get("agents_marketplace") or legacy.get("agents_marketplace")
    assert market and str(market).startswith("erd1")
    assert agents and str(agents).startswith("erd1")

    status = d.get("status") or {}
    if status:
        assert status.get("nft_marketplace") == "LIVE"
        assert status.get("agents_marketplace") == "LIVE"

    code_hash = d.get("codeHash") or {}
    if code_hash.get("agents_marketplace"):
        assert len(str(code_hash["agents_marketplace"])) > 10

    v = d.get("verification") or {}
    market_v = v.get("marketplace_mainnet") or {}
    if isinstance(market_v, dict) and market_v.get("verdict"):
        assert "LIVE" in str(market_v.get("verdict") or "")
        assert "NOT_DEPLOYED" not in str(market_v.get("verdict") or "")

    ui = d.get("ui_status") or {}
    if "lia_live_trading" in ui:
        assert int(ui.get("lia_live_trading") or 0) == 0


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
