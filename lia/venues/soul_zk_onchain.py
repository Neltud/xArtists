"""
Call MultiversX soul-zk-verifier (mxpy / HTTP)
==============================================
Builds endpoint args for verifyProof. Does not require PEM for views.
"""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Any, Optional

from lia.venues.soul_zk_halo2 import SCHEME_HALO2, SCHEME_GROTH16, validate_halo2_envelope

API = os.environ.get("LIA_MVX_API", "https://api.multiversx.com")


def verifier_address() -> Optional[str]:
    return (
        os.environ.get("SOUL_ZK_VERIFIER_ADDRESS", "").strip()
        or None
    )


def _query_vm(sc: str, func: str, args: list[str] | None = None) -> Any:
    """Simple vm-values/query via API — best effort."""
    payload = {
        "scAddress": sc,
        "funcName": func,
        "args": args or [],
    }
    req = urllib.request.Request(
        f"{API}/vm-values/query",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "xArtists-LIA/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def preview_verify_remote(
    *,
    proof_hex: str,
    commitment_hex: str,
    nullifier_hex: str,
    sc: Optional[str] = None,
) -> dict[str, Any]:
    sc = sc or verifier_address()
    if not sc:
        return {"ok": False, "status": "no_verifier_address"}
    env = validate_halo2_envelope(
        proof_hex=proof_hex,
        commitment_hex=commitment_hex,
        nullifier_hex=nullifier_hex,
    )
    if not env.get("ok"):
        return env
    # Full vm query encoding left to mxpy in production; return local gate + address
    return {
        "ok": True,
        "status": "local_envelope_ok",
        "sc": sc,
        "next": "attestor calls verifyProof via mxpy when LIA_LIVE",
        "envelope": env,
    }


def mxpy_verify_command(
    *,
    sc: str,
    proof_hex: str,
    commitment_hex: str,
    nullifier_hex: str,
    claim_type: str,
    epoch: int,
    subject: str,
    pem: str = "$PEM",
    gas: int = 20_000_000,
) -> str:
    """Shell snippet for attestor submit."""
    return f"""mxpy contract call {sc} \\
  --function verifyProof \\
  --arguments str:{proof_hex} str:{commitment_hex} str:{nullifier_hex} str:{claim_type} {epoch} addr:{subject} \\
  --gas-limit {gas} \\
  --pem {pem} \\
  --proxy https://gateway.multiversx.com \\
  --chain 1 \\
  --send
"""


def scheme_id_for_name(name: str) -> int:
    n = name.lower().strip()
    if n in ("halo2", "halo-2"):
        return SCHEME_HALO2
    if n in ("groth16", "groth"):
        return SCHEME_GROTH16
    return SCHEME_HALO2
