"""
Secure API keys for purchased / provisioned sub-agents.

Rules:
  - Never store raw keys in git or frontend bundles
  - Store only HMAC hash + metadata; plaintext shown once at issuance
  - Scoped: agent_id, rate limits, expiry, no PEM / no live trading flag
  - Revocable by LIA ops or owner wallet signature (off-chain registry)

Production: put issuance secrets in Vellum secrets manager only.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
REGISTRY = _ROOT / "data" / "agent_api_keys.json"  # hashes only

# Server-side pepper — MUST come from env in production
def _pepper() -> bytes:
    p = os.environ.get("XARTISTS_API_KEY_PEPPER", "")
    if not p:
        # Dev-only fallback — rotate immediately in prod
        p = "xartists-dev-pepper-change-me"
    return p.encode("utf-8")


def _hash_key(raw_key: str) -> str:
    return hmac.new(_pepper(), raw_key.encode("utf-8"), hashlib.sha256).hexdigest()


@dataclass
class ApiKeyRecord:
    key_id: str
    key_hash: str
    agent_id: str
    owner: str  # erd1 buyer
    created_at: float
    expires_at: float
    rate_limit_per_hour: int = 60
    scopes: list[str] = field(default_factory=lambda: ["signals:read", "status:read"])
    revoked: bool = False
    prefix: str = ""  # first 8 chars for UX lookup only

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def issue_key(
    *,
    agent_id: str,
    owner: str,
    ttl_days: int = 30,
    rate_limit_per_hour: int = 60,
    scopes: Optional[list[str]] = None,
) -> dict[str, Any]:
    """
    Returns {record meta, raw_key} — raw_key MUST be shown once then discarded.
    Never write raw_key to REGISTRY.
    """
    if not agent_id or not owner:
        raise ValueError("agent_id and owner required")
    # Forbidden scopes — never grant signing / live trading via pack key
    scopes = list(scopes or ["signals:read", "status:read"])
    banned = {"tx:sign", "live:trade", "pem:read", "admin"}
    scopes = [s for s in scopes if s not in banned]

    raw = "xag_" + secrets.token_urlsafe(32)
    key_id = "kid_" + secrets.token_hex(8)
    now = time.time()
    rec = ApiKeyRecord(
        key_id=key_id,
        key_hash=_hash_key(raw),
        agent_id=agent_id,
        owner=owner,
        created_at=now,
        expires_at=now + ttl_days * 86400,
        rate_limit_per_hour=rate_limit_per_hour,
        scopes=scopes,
        revoked=False,
        prefix=raw[:12],
    )
    _save_record(rec)
    return {
        "key_id": key_id,
        "prefix": rec.prefix,
        "agent_id": agent_id,
        "owner": owner,
        "expires_at": rec.expires_at,
        "scopes": scopes,
        "rate_limit_per_hour": rate_limit_per_hour,
        "raw_key": raw,  # one-time
        "warning": "Store raw_key securely; it will not be shown again",
    }


def verify_key(raw_key: str) -> dict[str, Any]:
    h = _hash_key(raw_key)
    for rec in _load_all():
        if rec.get("key_hash") == h:
            if rec.get("revoked"):
                return {"ok": False, "error": "revoked"}
            if time.time() > float(rec.get("expires_at") or 0):
                return {"ok": False, "error": "expired"}
            return {
                "ok": True,
                "key_id": rec["key_id"],
                "agent_id": rec["agent_id"],
                "owner": rec["owner"],
                "scopes": rec.get("scopes") or [],
                "rate_limit_per_hour": rec.get("rate_limit_per_hour") or 60,
            }
    return {"ok": False, "error": "unknown"}


def revoke_key(key_id: str, *, by_owner: Optional[str] = None) -> bool:
    rows = _load_all()
    ok = False
    for r in rows:
        if r.get("key_id") == key_id:
            if by_owner and r.get("owner") != by_owner:
                return False
            r["revoked"] = True
            ok = True
    if ok:
        _write_all(rows)
    return ok


def _load_all() -> list[dict[str, Any]]:
    if not REGISTRY.exists():
        return []
    try:
        return list(json.loads(REGISTRY.read_text(encoding="utf-8")).get("keys") or [])
    except json.JSONDecodeError:
        return []


def _write_all(rows: list[dict[str, Any]]) -> None:
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY.write_text(
        json.dumps({"updated": time.time(), "keys": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


def _save_record(rec: ApiKeyRecord) -> None:
    rows = _load_all()
    rows.append(rec.to_dict())
    _write_all(rows[-500:])


if __name__ == "__main__":
    issued = issue_key(agent_id="xag-demo", owner="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4af")
    raw = issued.pop("raw_key")
    print("issued meta", json.dumps(issued, indent=2))
    print("verify", verify_key(raw))
    print("verify bad", verify_key("xag_wrong"))
