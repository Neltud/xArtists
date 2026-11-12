"""Offline xOrus Data preproduction audit. No deploy, commerce or execution.

Every result is a commercial NO_GO, including successful technical preflights.
A signed manifest is not proof of actual contractual redistribution rights.
No user-controlled source may provide a trusted key or entitlement.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

from lia.xorus.catalog import catalog

PURPOSE = "xorus-data-preflight-v1"
MAX_BYTES = 10_000_000
PRODUCTS = frozenset({"standard", "pro", "nft_data_pack"})
NETWORKS = frozenset({"multiversx", "polygon", "solana"})
FINANCIAL_FLAGS = ("payments_enabled", "nft_mint_enabled", "tro_transfers_enabled")


def _time(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.utcoffset() is None:
            return None
        return dt.astimezone(timezone.utc)
    except (ValueError, OverflowError, TypeError):
        return None


def _digest_file(root: Path | None, filename: Any, digest: Any) -> bool:
    if not isinstance(root, Path) or not isinstance(filename, str) or not isinstance(digest, str):
        return False
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        return False
    p = Path(filename)
    if not filename or p.is_absolute() or ".." in p.parts:
        return False
    try:
        base = root.resolve(strict=True)
        target = (base / p).resolve(strict=True)
        if not target.is_relative_to(base) or not target.is_file() or target.stat().st_size > MAX_BYTES:
            return False
        return hashlib.sha256(target.read_bytes()).hexdigest() == digest
    except (OSError, ValueError):
        return False


def _payload(manifest: Mapping[str, Any], observations: Sequence[Mapping[str, Any]],
             licenses: Sequence[Mapping[str, Any]]) -> bytes:
    return json.dumps({"purpose": PURPOSE, "manifest": manifest,
                       "observations": observations, "licenses": licenses},
                      ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _verify_attestation(manifest: Mapping[str, Any],
                        observations: Sequence[Mapping[str, Any]],
                        licenses: Sequence[Mapping[str, Any]], *,
                        trusted_public_key: Path | None,
                        detached_attestation: Path | None,
                        now: datetime) -> bool:
    """Signature check uses ONLY explicitly provisioned, independent trust material."""
    if not isinstance(trusted_public_key, Path) or not isinstance(detached_attestation, Path):
        return False
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        key = serialization.load_pem_public_key(trusted_public_key.read_bytes())
        if not isinstance(key, Ed25519PublicKey):
            return False
        receipt = json.loads(detached_attestation.read_text(encoding="utf-8"))
        if not isinstance(receipt, dict) or receipt.get("purpose") != PURPOSE:
            return False
        if _time(receipt.get("expires_at")) is None or _time(receipt["expires_at"]) <= now:
            return False
        digest = hashlib.sha256(_payload(manifest, observations, licenses)).hexdigest()
        if receipt.get("payload_sha256") != digest:
            return False
        statement = json.dumps({k: receipt[k] for k in ("purpose", "payload_sha256", "expires_at")},
                               sort_keys=True, separators=(",", ":")).encode("utf-8")
        key.verify(base64.b64decode(receipt["signature_base64"], validate=True), statement)
        return True
    except (OSError, ValueError, TypeError, KeyError, ImportError, Exception):
        return False


def assess_preproduction(
    manifest: Mapping[str, Any],
    observations: Sequence[Mapping[str, Any]],
    licenses: Sequence[Mapping[str, Any]],
    *,
    evidence_root: Path | None = None,
    trusted_public_key: Path | None = None,
    detached_attestation: Path | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Check independently evidenced inputs; NEVER grant access or commercial GO.

    The caller must obtain trusted_public_key from a protected administrator,
    not from a request body or a self-attested manifest.
    """
    moment = now or datetime.now(timezone.utc)
    if moment.utcoffset() is None:
        raise ValueError("now must have a timezone")
    moment = moment.astimezone(timezone.utc)
    errors: list[str] = []
    if not isinstance(manifest, Mapping) or not isinstance(observations, (list, tuple)) or not isinstance(licenses, (list, tuple)):
        return {"preflight": "FAIL", "commercial": "NO_GO", "commercial_enabled": False,
                "errors": ["invalid_inputs"]}
    if not _verify_attestation(manifest, observations, licenses,
                               trusted_public_key=trusted_public_key,
                               detached_attestation=detached_attestation, now=moment):
        errors.append("independent_signature_missing_or_invalid")
    if any(manifest.get(flag) is not False for flag in FINANCIAL_FLAGS):
        errors.append("financial_operations_must_remain_disabled")
    canonical = {item["id"] for item in catalog()}
    if len(canonical) != 120:
        errors.append("canonical_catalog_invalid")
    ids = manifest.get("included_signal_ids")
    if not isinstance(ids, list) or not ids or len(ids) > 120 or any(
        not isinstance(sid, str) or sid not in canonical for sid in ids
    ):
        errors.append("invalid_or_legacy_signal_ids")
        ids = []
    if len(ids) != len(set(ids)):
        errors.append("duplicate_included_ids")
    product = manifest.get("product")
    if product not in PRODUCTS:
        errors.append("invalid_product")

    def indexed(rows: Sequence[Mapping[str, Any]], label: str) -> dict[str, Mapping[str, Any]]:
        found: dict[str, Mapping[str, Any]] = {}
        for row in rows:
            if not isinstance(row, Mapping) or row.get("signal_id") not in canonical:
                errors.append(f"{label}:invalid_row")
                continue
            sid = row["signal_id"]
            if sid in found:
                errors.append(f"{label}:duplicate:{sid}")
            found[sid] = row
        return found

    obs_by_id, lic_by_id = indexed(observations, "observations"), indexed(licenses, "licenses")
    for sid in ids:
        obs, lic = obs_by_id.get(sid), lic_by_id.get(sid)
        if not obs or not lic:
            errors.append(f"{sid}:missing_source_or_license")
            continue
        if (obs.get("semantic_name") != sid or obs.get("provider") != lic.get("provider")
            or not obs.get("provider") or obs.get("network") not in NETWORKS
            or obs.get("observation_status") != "observed"):
            errors.append(f"{sid}:source_unverified")
        if not _digest_file(evidence_root, obs.get("proof_evidence_path"), obs.get("proof_sha256")):
            errors.append(f"{sid}:observation_evidence_invalid")
        source, received = _time(obs.get("source_ts")), _time(obs.get("received_at"))
        ttl = obs.get("freshness_max_age_seconds")
        try:
            ttl = int(ttl)
        except (ValueError, TypeError):
            ttl = 0
        if (not source or not received or not 1 <= ttl <= 86400 or
            not source <= received <= moment or
            (moment - source).total_seconds() > ttl):
            errors.append(f"{sid}:source_stale_or_invalid")
        if (lic.get("license_status") != "approved" or lic.get("redistribution_allowed") != "yes"
            or not lic.get("license_reference") or not lic.get("approved_by")):
            errors.append(f"{sid}:license_not_authorized")
        if not _digest_file(evidence_root, lic.get("evidence_location"), lic.get("evidence_sha256")):
            errors.append(f"{sid}:license_evidence_invalid")
        valid_from, valid_until = _time(lic.get("valid_from")), _time(lic.get("valid_until"))
        if not valid_from or not valid_until or not valid_from <= moment < valid_until:
            errors.append(f"{sid}:license_expired_or_invalid")
        products = {p.strip() for p in str(lic.get("permitted_products", "")).split(";")}
        if product not in products or (product == "nft_data_pack" and lic.get("nft_pack_allowed") != "yes"):
            errors.append(f"{sid}:product_rights_missing")
    return {
        "preflight": "PASS_REQUIRES_INDEPENDENT_HUMAN_REVIEW" if not errors else "FAIL",
        "commercial": "NO_GO",
        "commercial_enabled": False,
        "errors": errors,
        "signals_defined": len(canonical),
        "signals_examined": len(ids),
    }
