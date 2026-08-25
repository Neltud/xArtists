"""
MultiversX chain timing for LIA (paper + live executor).

Pre-Supernova mainnet: ~6s rounds.
Supernova (Devnet live; mainnet activation 10 Sep 2026): 600ms rounds.

Gas limits / ABIs / addresses do NOT change. Only wait/poll intervals should.

Env:
  CHAIN_SUPERNOVA=1   → use Supernova-speed defaults (also SUPERNOVA=1)
"""
from __future__ import annotations

import os
from typing import Any


def is_supernova_mode() -> bool:
    for key in ("CHAIN_SUPERNOVA", "SUPERNOVA"):
        v = os.environ.get(key, "").strip().lower()
        if v in ("1", "true", "yes", "on"):
            return True
    return False


def timing_defaults() -> dict[str, Any]:
    supernova = is_supernova_mode()
    mode = "supernova" if supernova else "pre_supernova"
    if supernova:
        return {
            "mode": mode,
            "round_ms": 600,
            "tx_status_poll_ms": 800,
            "tx_status_timeout_ms": 45_000,
            "nonce_poll_ms": 500,
            "nonce_advance_poll_ms": 600,
            "nonce_stable_timeout_ms": 20_000,
            "nonce_advance_timeout_ms": 45_000,
            "fetch_timeout_s": 12.0,
        }
    return {
        "mode": mode,
        "round_ms": 6_000,
        "tx_status_poll_ms": 3_000,
        "tx_status_timeout_ms": 120_000,
        "nonce_poll_ms": 1_500,
        "nonce_advance_poll_ms": 2_000,
        "nonce_stable_timeout_ms": 45_000,
        "nonce_advance_timeout_ms": 120_000,
        "fetch_timeout_s": 12.0,
    }


# Convenience aliases for executor imports
def tx_poll_ms() -> int:
    return int(timing_defaults()["tx_status_poll_ms"])


def tx_timeout_ms() -> int:
    return int(timing_defaults()["tx_status_timeout_ms"])


def nonce_poll_ms() -> int:
    return int(timing_defaults()["nonce_poll_ms"])
