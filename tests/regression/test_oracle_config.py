"""Regression: oracle config shape + pure helpers (no network required for config)."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def test_oracle_config_exists():
    p = ROOT / "data" / "oracle_config.json"
    assert p.exists()
    d = json.loads(p.read_text(encoding="utf-8"))
    assert d.get("network") == "mainnet"
    assert "pairs" in d
    assert "tokens" in d
    assert d["tokens"].get("WEGLD")
    assert d["tokens"].get("TRO")


def test_median_filter_rejects_outlier():
    from lia.oracles.price_oracle import OracleQuote, _median_filter

    qs = [
        OracleQuote("EGLD-USD", 2.5, "a", 0),
        OracleQuote("EGLD-USD", 2.55, "b", 0),
        OracleQuote("EGLD-USD", 10.0, "c", 0),  # outlier
    ]
    out = _median_filter(qs, max_dev=0.05)
    assert all(q.price < 5 for q in out)


def test_consensus_weights_prefer_onchain():
    from lia.oracles.price_oracle import OracleQuote, _consensus_quotes

    cfg = {
        "policy": {
            "max_age_sec": 9999,
            "max_deviation": 0.5,
            "prefer_onchain_weight": 2.0,
            "centralized_weight": 0.5,
        }
    }
    qs = [
        OracleQuote("EGLD-USD", 2.0, "mvx_economics", 1e12, meta={"onchain_index": True}),
        OracleQuote("EGLD-USD", 4.0, "coingecko", 1e12, meta={"centralized": True}),
    ]
    r = _consensus_quotes("EGLD-USD", qs, cfg)
    assert r["ok"] is True
    # weighted: (2*2 + 4*0.5) / 2.5 = 6/2.5 = 2.4
    assert abs(r["price"] - 2.4) < 0.01


def test_fetch_mvx_token_mocked():
    from lia.oracles import price_oracle as po

    with patch.object(po, "_http_json", return_value={"price": 2.69, "ticker": "WEGLD"}):
        q = po.fetch_mvx_token("WEGLD-bd4d79", "WEGLD-USD")
    assert q is not None
    assert q.price == 2.69
    assert q.meta.get("onchain_index") is True


if __name__ == "__main__":
    test_oracle_config_exists()
    test_median_filter_rejects_outlier()
    test_consensus_weights_prefer_onchain()
    test_fetch_mvx_token_mocked()
    print("OK test_oracle_config")
