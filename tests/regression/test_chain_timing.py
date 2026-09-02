"""Regression: Supernova refreshRate → poll mode (pure, no network)."""
from __future__ import annotations

import os

from lia.gas.chain_timing import (
    apply_refresh_rate,
    is_supernova_mode,
    mode_from_refresh_rate,
    timing_defaults,
)


def test_refresh_rate_thresholds():
    assert mode_from_refresh_rate(600) is True
    assert mode_from_refresh_rate(800) is True
    assert mode_from_refresh_rate(1000) is True
    assert mode_from_refresh_rate(1001) is False
    assert mode_from_refresh_rate(6000) is False
    assert mode_from_refresh_rate(0) is False
    assert mode_from_refresh_rate(None) is False
    assert mode_from_refresh_rate("nope") is False  # type: ignore[arg-type]


def test_apply_detects_devnet_and_mainnet(monkeypatch=None):
    # isolate env
    os.environ.pop("CHAIN_SUPERNOVA", None)
    os.environ.pop("SUPERNOVA", None)
    apply_refresh_rate(6000)
    assert is_supernova_mode() is False
    assert timing_defaults()["tx_status_poll_ms"] == 3_000
    apply_refresh_rate(600)
    assert is_supernova_mode() is True
    assert timing_defaults()["tx_status_poll_ms"] == 800
    assert timing_defaults()["round_ms"] == 600


def test_env_force_pre_wins_over_detect():
    os.environ["CHAIN_SUPERNOVA"] = "0"
    try:
        apply_refresh_rate(600)
        assert is_supernova_mode() is False
        assert timing_defaults()["mode"] == "pre_supernova"
    finally:
        os.environ.pop("CHAIN_SUPERNOVA", None)
        apply_refresh_rate(6000)


def test_env_force_supernova_wins_over_detect():
    os.environ["CHAIN_SUPERNOVA"] = "1"
    try:
        apply_refresh_rate(6000)
        assert is_supernova_mode() is True
        assert timing_defaults()["tx_status_poll_ms"] == 800
    finally:
        os.environ.pop("CHAIN_SUPERNOVA", None)
        apply_refresh_rate(6000)


if __name__ == "__main__":
    test_refresh_rate_thresholds()
    test_apply_detects_devnet_and_mainnet()
    test_env_force_pre_wins_over_detect()
    test_env_force_supernova_wins_over_detect()
    print("OK test_chain_timing")
