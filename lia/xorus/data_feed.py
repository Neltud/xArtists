"""Historical internal provenance filter. No network, payments, trades or mint.

Providers must be authenticated and licensed out of band. Model prompts and
client payloads must never grant redistribution or entitlement rights.
The legacy build_data_pack result is not the customer product: xArtists sells
its analyses. Customer reports use analysis_report, without raw observations.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

from lia.xorus.catalog import catalog

ISO_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
HASH = re.compile(r"^[0-9a-f]{64}$")
NETWORKS = frozenset({"multiversx", "polygon", "solana"})
MODES = frozenset({"onchain", "market", "paper"})
SIGNAL_IDS = frozenset(item["id"] for item in catalog())


# Proof-of-bytes is not proof of independent market corroboration or of a licence.
# A private, operator-chosen evidence root is mandatory for these checks.
MAX_PROOF_BYTES = 65_536
PROOF_FIELDS = frozenset({"signal_id", "provider", "source_ts", "network", "data_mode", "value"})


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for name, value in pairs:
        if name in result:
            raise ValueError("duplicate proof field")
        result[name] = value
    return result


def _reject_nonfinite(_: str) -> None:
    raise ValueError("nonfinite JSON proof")


def _proof_matches(row: Mapping[str, Any], root: Path | None) -> bool:
    """Verify stored proof bytes AND bind every scalar to the observation.

    The bytes are a canonical *observation envelope*, NOT independent price
    corroboration. A caller-controlled public path or a hash-shaped string
    cannot assert anything about provider authenticity or commercial rights.
    """
    filename, digest = row.get("proof_evidence_path"), row.get("proof_sha256")
    if (not isinstance(root, Path) or not isinstance(filename, str)
        or not 1 <= len(filename) <= 180 or not isinstance(digest, str)
        or not HASH.fullmatch(digest)):
        return False
    try:
        relative = Path(filename)
        if relative.is_absolute() or any(piece in (".", "..") for piece in relative.parts):
            return False
        base = root.resolve(strict=True)
        target = (base / relative).resolve(strict=True)
        if not target.is_relative_to(base) or not target.is_file():
            return False
        with target.open("rb") as handle:
            data = handle.read(MAX_PROOF_BYTES + 1)
        if not data or len(data) > MAX_PROOF_BYTES:
            return False
        if hashlib.sha256(data).hexdigest() != digest:
            return False
        proof = json.loads(
            data.decode("utf-8"), object_pairs_hook=_unique_object,
            parse_constant=_reject_nonfinite,
        )
        return (isinstance(proof, dict) and set(proof) == PROOF_FIELDS
                and all(type(proof[key]) is type(row.get(key))
                        and proof[key] == row[key] for key in PROOF_FIELDS))
    except (OSError, UnicodeError, ValueError, TypeError, KeyError):
        return False


def _finite(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        return False
    try:
        return math.isfinite(value)
    except (OverflowError, ValueError, TypeError):
        return False


def count_proof_bound_signals(
    pack: Mapping[str, Any] | None, *, evidence_root: Path | None = None,
) -> tuple[int, int]:
    """Evidence-integrity coverage only; MUST NOT be called 'independent'."""
    if (not isinstance(pack, Mapping) or pack.get("engine") != "xorus"
        or pack.get("executable") is not False or pack.get("live_trading") is not False
        or not isinstance(pack.get("observations"), list)):
        return 0, 0
    ids: set[str] = set()
    for row in pack["observations"]:
        if (isinstance(row, Mapping) and row.get("status") == "observed"
            and row.get("proof_integrity_checked") is True
            and isinstance(row.get("signal_id"), str)
            and row["signal_id"] in SIGNAL_IDS
            and not row["signal_id"].startswith("external.")
            and _proof_matches(row, evidence_root)):
            ids.add(row["signal_id"])
    return len(ids), len({sid.split(".", 1)[0] for sid in ids})


def count_verified_signals(_pack: Mapping[str, Any] | None) -> tuple[int, int]:
    """Fail closed until a separate, pinned independent verifier exists.

    Observation status, a SHA digest, an operator-provided trust-policy flag
    and even matching evidence bytes are NOT independent market verification.
    No in-memory dictionary may grant this count. A subsequent, separately
    reviewed cryptographic attestation protocol is required before >0.
    """
    return 0, 0


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
    evidence_root: Path | None = None,
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
            or not _finite(value)
            or not isinstance(obs.get("network"), str) or obs["network"] not in NETWORKS
            or not isinstance(obs.get("data_mode"), str) or obs["data_mode"] not in MODES
            or not isinstance(obs.get("proof_sha256"), str)
            or not HASH.fullmatch(obs["proof_sha256"])):
            rejected += 1
            continue
        # Supplying a trusted local root switches proof handling to fail-closed.
        # Without it, legacy observations may be retained but NEVER verified.
        proof_ok = _proof_matches(obs, evidence_root) if evidence_root is not None else False
        if evidence_root is not None and not proof_ok:
            rejected += 1
            continue
        candidate = {
            "signal_id": sid, "value": value, "status": "observed",
            "network": obs["network"], "data_mode": obs["data_mode"],
            "provider": provider, "source_ts": obs["source_ts"],
            "license_ref": policy["license_ref"],
            "proof_sha256": obs["proof_sha256"], "ttl_seconds": ttl_seconds,
            "proof_integrity_checked": proof_ok,
            "proof_evidence_path": obs.get("proof_evidence_path") if proof_ok else None,
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
        "proof_integrity_checked_signals": sum(
            row["proof_integrity_checked"] is True for row in accepted.values()),
        "independently_verified_signals": 0,
        "rejected_observations": rejected, "observations": rows,
        "networks_supported_for_read": sorted(NETWORKS),
        "advisory_only": True, "executable": False, "live_trading": False,
        "access_granted": False,
        "licensing_note": "Provider grants must be verified server-side; this is not an entitlement.",
    }
