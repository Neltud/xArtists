"""Historical internal provenance filter. No network, payments, trades or mint.

Providers must be authenticated and licensed out of band. Model prompts and
client payloads must never grant redistribution or entitlement rights.
The legacy build_data_pack result is not the customer product: xArtists sells
its analyses. Customer reports use analysis_report, without raw observations.
"""
from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

from lia.xorus.catalog import catalog

ISO_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
HASH = re.compile(r"^[0-9a-f]{64}$")
NETWORKS = frozenset({"multiversx", "polygon", "solana"})
MODES = frozenset({"onchain", "market", "paper"})
SIGNAL_IDS = frozenset(item["id"] for item in catalog())


def _utc(text: Any) -> datetime | None:
    if not isinstance(text, str) or not ISO_Z.fullmatch(text):
        return None
    try:
        return datetime.strptime(text, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def build_data_pack(
    observations: Iterable[Mapping[str, Any]],
    *,
    trusted_providers: Mapping[str, Mapping[str, Any]] | None = None,
    now: datetime | None = None,
    ttl_seconds: int = 900,
) -> dict[str, Any]:
    """Summarize only licensed, fresh, finite, provenance-bound observations."""
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    if isinstance(ttl_seconds, bool) or not isinstance(ttl_seconds, int) or not 1 <= ttl_seconds <= 86400:
        raise ValueError("invalid TTL")
    providers = trusted_providers or {}
    accepted: dict[str, dict[str, Any]] = {}
    rejected = 0
    for obs in observations:
        if not isinstance(obs, Mapping):
            rejected += 1
            continue
        sid = obs.get("signal_id")
        provider = obs.get("provider")
        policy = providers.get(provider) if isinstance(provider, str) else None
        source_ts = _utc(obs.get("source_ts"))
        policy_expiry = _utc(policy.get("expires_at")) if isinstance(policy, Mapping) else None
        value = obs.get("value")
        if (not isinstance(sid, str) or sid not in SIGNAL_IDS
            or not isinstance(policy, Mapping)
            or policy.get("redistribution_allowed") is not True
            or policy.get("verified_source") is not True
            or not isinstance(policy.get("license_ref"), str) or not policy["license_ref"].strip()
            or policy_expiry is None or policy_expiry <= moment
            or source_ts is None or (moment - source_ts).total_seconds() > ttl_seconds
            or (source_ts - moment).total_seconds() > 120
            or isinstance(value, bool) or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or obs.get("network") not in NETWORKS
            or obs.get("data_mode") not in MODES
            or not isinstance(obs.get("proof_sha256"), str)
            or not HASH.fullmatch(obs["proof_sha256"])):
            rejected += 1
            continue
        candidate = {
            "signal_id": sid, "value": value, "status": "observed",
            "network": obs["network"], "data_mode": obs["data_mode"],
            "provider": provider, "source_ts": obs["source_ts"],
            "license_ref": policy["license_ref"],
            "proof_sha256": obs["proof_sha256"], "ttl_seconds": ttl_seconds,
            "is_stale": False,
        }
        if sid not in accepted or candidate["source_ts"] > accepted[sid]["source_ts"]:
            accepted[sid] = candidate
    rows = [accepted.get(row["id"], {"signal_id": row["id"], "status": "no_input"})
            for row in catalog()]
    return {
        "engine": "xorus", "brand": "xOrus",
        "signals_defined": 120, "signals_fed": len(accepted),
        "families_fed": len({sid.split(".")[0] for sid in accepted}),
        "rejected_observations": rejected, "observations": rows,
        "networks_supported_for_read": sorted(NETWORKS),
        "advisory_only": True, "executable": False, "live_trading": False,
        "access_granted": False,
        "licensing_note": "Provider grants must be verified server-side; this is not an entitlement.",
    }
