"""
MultiversX chain timing for LIA (paper + live executor).

Pre-Supernova mainnet: ~6s rounds.
Supernova (Devnet live since 20 Aug 2026; mainnet activation 10 Sep 2026): 600ms rounds.

Gas limits / ABIs / addresses do NOT change. Only wait/poll intervals should.

Env:
  CHAIN_SUPERNOVA=1 / SUPERNOVA=1   → force Supernova-speed defaults
  CHAIN_SUPERNOVA=0                 → force pre-Supernova
  unset                             → auto after apply_refresh_rate() / probe_api()
                                      (conservative 6s until probed)
"""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

SUPERNOVA_REFRESH_RATE_MAX_MS = 1_000

_detected: bool | None = None


def _env_raw() -> str:
    for key in ("CHAIN_SUPERNOVA", "SUPERNOVA"):
        v = os.environ.get(key, "").strip().lower()
        if v:
            return v
    return ""


def mode_from_refresh_rate(refresh_rate_ms: float | int | None) -> bool:
    """True if stats.refreshRate indicates Supernova-speed blocks."""
    try:
        rr = float(refresh_rate_ms)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return False
    return 0 < rr <= SUPERNOVA_REFRESH_RATE_MAX_MS


def apply_refresh_rate(refresh_rate_ms: float | int | None) -> bool:
    global _detected
    _detected = mode_from_refresh_rate(refresh_rate_ms)
    return _detected


def detected_supernova() -> bool | None:
    return _detected


def is_supernova_mode() -> bool:
    v = _env_raw()
    if v in ("1", "true", "yes", "on"):
        return True
    if v in ("0", "false", "off", "no"):
        return False
    return bool(_detected)


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


def probe_api(api_base: str | None = None, timeout: float = 8.0) -> dict[str, Any]:
    """GET /stats and cache refreshRate. Fail-soft: leaves conservative defaults."""
    base = (api_base or os.environ.get("MVX_API") or "https://api.multiversx.com").rstrip("/")
    url = f"{base}/stats"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/chain-timing"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            stats = json.loads(r.read().decode("utf-8"))
        apply_refresh_rate(stats.get("refreshRate"))
        return {"ok": True, "stats": stats, "mode": timing_defaults()["mode"]}
    except Exception as exc:  # noqa: BLE001 — probe must never break executor
        return {"ok": False, "error": str(exc), "mode": timing_defaults()["mode"]}


def tx_poll_ms() -> int:
    return int(timing_defaults()["tx_status_poll_ms"])


def tx_timeout_ms() -> int:
    return int(timing_defaults()["tx_status_timeout_ms"])


def nonce_poll_ms() -> int:
    return int(timing_defaults()["nonce_poll_ms"])
