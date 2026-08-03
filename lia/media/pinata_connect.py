"""
Pinata connection test + file pin for xArtists / Vellum.
Auth: PINATA_JWT (preferred) or PINATA_API_KEY + PINATA_API_SECRET.
Never log full JWT.
"""
from __future__ import annotations

import json
import mimetypes
import os
import uuid
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

from lia.media.storage import GATEWAY, _pinata_headers, pin_json_pinata, storage_status

PINATA_TEST = "https://api.pinata.cloud/data/testAuthentication"
PINATA_FILE = "https://api.pinata.cloud/pinning/pinFileToIPFS"


def test_auth() -> dict[str, Any]:
    headers = _pinata_headers()
    if not headers:
        return {
            "ok": False,
            "error": "Set PINATA_JWT or PINATA_API_KEY+PINATA_API_SECRET in Vellum secrets",
            "hint": "Create key at https://app.pinata.cloud — Sign up with Google/Gmail",
        }
    req = urllib.request.Request(
        PINATA_TEST,
        headers={**headers, "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode()
        data = json.loads(body) if body.strip().startswith("{") else {"raw": body}
        return {
            "ok": True,
            "message": data.get("message") or "Authenticated",
            "gateway": GATEWAY,
            "auth_mode": "jwt" if os.environ.get("PINATA_JWT") else "key_secret",
        }
    except urllib.error.HTTPError as e:
        err_body = e.read()[:300]
        return {"ok": False, "error": f"HTTP {e.code}", "detail": repr(err_body)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def pin_file(path: str | Path, *, name: Optional[str] = None) -> dict[str, Any]:
    """Multipart pinFileToIPFS without external deps (stdlib)."""
    headers_auth = _pinata_headers()
    if not headers_auth:
        return {"ok": False, "error": "PINATA not configured"}

    p = Path(path)
    if not p.is_file():
        return {"ok": False, "error": f"file not found: {p}"}

    boundary = f"----xArtistsPinata{uuid.uuid4().hex}"
    filename = name or p.name
    mime = mimetypes.guess_type(str(p))[0] or "application/octet-stream"
    file_bytes = p.read_bytes()

    meta = json.dumps({"name": filename})
    parts: list[bytes] = []
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="pinataMetadata"\r\n\r\n'
        f"{meta}\r\n".encode()
    )
    parts.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n"
        ).encode()
        + file_bytes
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)

    req = urllib.request.Request(
        PINATA_FILE,
        data=body,
        headers={
            **headers_auth,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read().decode())
        cid = data.get("IpfsHash") or data.get("cid")
        return {
            "ok": True,
            "cid": cid,
            "uri": f"ipfs://{cid}" if cid else None,
            "gateway_url": f"{GATEWAY.rstrip('/')}/{cid}" if cid else None,
            "size": data.get("PinSize"),
            "raw": data,
        }
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": f"HTTP {e.code}: {e.read()[:400]!r}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def connect_report() -> dict[str, Any]:
    status = storage_status()
    auth = test_auth()
    return {"storage": status, "auth": auth}


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Pinata connect / pin file")
    ap.add_argument("--file", help="Path to image/video/audio to pin")
    ap.add_argument("--name", help="Pinata display name")
    args = ap.parse_args()

    if args.file:
        print(json.dumps(pin_file(args.file, name=args.name), indent=2))
    else:
        print(json.dumps(connect_report(), indent=2))
