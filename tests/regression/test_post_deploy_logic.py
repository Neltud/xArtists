"""Regression: post_deploy_verify pure helpers (mocked accounts, no network)."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _load_pdv():
    path = ROOT / "scripts" / "post_deploy_verify.py"
    spec = importlib.util.spec_from_file_location("post_deploy_verify", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


pdv = _load_pdv()


def test_codehash_of_null():
    assert pdv.codehash_of({}) is None
    assert pdv.codehash_of({"codeHash": None, "code": ""}) is None
    assert pdv.codehash_of({"codeHash": "", "code": ""}) is None


def test_codehash_of_live():
    h = "a" * 64
    assert pdv.codehash_of({"codeHash": h, "code": "deadbeef"}) == h


def test_check_account_no_address():
    r = pdv.check_account("marketplace", None)
    assert r["ok"] is False
    assert r["verdict"] == "NO_ADDRESS"


def test_check_account_live_mocked():
    fake = {"codeHash": "b" * 64, "code": "ab", "balance": "1"}
    with patch.object(pdv, "http_json", return_value=fake):
        r = pdv.check_account(
            "marketplace",
            "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t",
        )
    assert r["ok"] is True
    assert r["verdict"] == "LIVE"


def test_check_account_empty_mocked():
    fake = {"codeHash": None, "code": "", "balance": "0"}
    with patch.object(pdv, "http_json", return_value=fake):
        r = pdv.check_account(
            "agents",
            "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t",
        )
    assert r["ok"] is False
    assert r["verdict"] == "NOT_DEPLOYED"


def test_build_vite_flags():
    mkt = {"address": "erd1qqq…", "ok": True}
    ag = {"address": "erd1qqq…", "ok": False}
    v = pdv.build_vite(mkt, ag)
    assert v["VITE_MARKETPLACE_CODEHASH_OK"] == "1"
    assert v["VITE_AGENTS_CODEHASH_OK"] == "0"
    assert v["VITE_AGENTS_FEE_BPS"] == "300"


def test_consistency_mismatch():
    contracts = {"marketplace": "erd1aaa", "agents_marketplace": "erd1bbb"}
    deployed = {"nft-marketplace": "erd1aaa", "agents-marketplace": "erd1CCC"}
    checks = pdv.check_deployed_consistency(contracts, deployed)
    by_id = {c["id"]: c for c in checks}
    assert by_id["consistency_nft-marketplace"]["pass"] is True
    assert by_id["consistency_agents-marketplace"]["pass"] is False


def test_build_release_state_fail_closed():
    mkt = {"address": "erd1market", "ok": True, "verdict": "LIVE"}
    ag = {"address": None, "ok": False, "verdict": "NO_ADDRESS"}
    rel = pdv.build_release_state(mkt, ag, critical_ok=False)
    assert rel["publication_operator"] == "vellum"
    assert rel["mode"] == "pre-mainnet"
    assert rel["allow_user_marketplace_actions"] is False
    assert rel["allow_live_ops_flags"] is False
    assert rel["contracts"]["marketplace"]["codehash_ok"] is True
    assert rel["contracts"]["agents_marketplace"]["codehash_ok"] is False


if __name__ == "__main__":
    test_codehash_of_null()
    test_codehash_of_live()
    test_check_account_no_address()
    test_check_account_live_mocked()
    test_check_account_empty_mocked()
    test_build_vite_flags()
    test_consistency_mismatch()
    test_build_release_state_fail_closed()
    print("OK test_post_deploy_logic")
