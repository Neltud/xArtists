"""
Media storage helpers — IPFS (Pinata), Arweave placeholder, YouTube as external link only.
Keys: PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET (server/Vellum).
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

PINATA_UPLOAD = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_JSON = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
GATEWAY = os.environ.get("IPFS_GATEWAY", "https://gateway.pinata.cloud/ipfs/")


def _pinata_headers() -> dict[str, str]:
    jwt = os.environ.get("PINATA_JWT", "").strip()
    if jwt:
        return {"Authorization": f"Bearer {jwt}"}
    key = os.environ.get("PINATA_API_KEY", "").strip()
    secret = os.environ.get("PINATA_API_SECRET", "").strip()
    if key and secret:
        return {"pinata_api_key": key, "pinata_secret_api_key": secret}
    return {}


def storage_status() -> dict[str, Any]:
    h = _pinata_headers()
    return {
        "pinata_configured": bool(h),
        "gateway": GATEWAY,
        "youtube_as_nft_media": False,
        "youtube_as_external_link": True,
        "note": "YouTube = promo link only; sale media must be IPFS/Arweave",
    }


def build_nft_metadata(
    *,
    name: str,
    description: str = "",
    image_uri: str = "",
    animation_uri: str = "",
    media_kind: str = "image",  # image | video | audio
    mode: str = "digital",  # digital | physical
    youtube_url: str = "",
    attributes: Optional[list[dict[str, Any]]] = None,
    royalty_bps: int = 500,
) -> dict[str, Any]:
    """OpenSea-style / MVX-friendly metadata object."""
    meta: dict[str, Any] = {
        "name": name,
        "description": description,
        "image": image_uri,
        "attributes": attributes
        or [
            {"trait_type": "media", "value": media_kind},
            {"trait_type": "mode", "value": mode},
            {"trait_type": "royalty_bps", "value": royalty_bps},
        ],
    }
    if animation_uri:
        meta["animation_url"] = animation_uri
    if youtube_url:
        # external only — not primary media
        meta["external_url"] = youtube_url
        meta["youtube_url"] = youtube_url
    if mode == "physical":
        meta["description"] = (
            (description or "")
            + "\n\n[Phygital] NFT certifies authenticity; physical delivery is off-chain."
        ).strip()
    return meta


def pin_json_pinata(metadata: dict[str, Any], *, name: str = "xartists-meta") -> dict[str, Any]:
    headers = _pinata_headers()
    if not headers:
        return {
            "ok": False,
            "error": "PINATA_JWT or PINATA_API_KEY/SECRET not set",
            "dry_run_metadata": metadata,
        }
    body = json.dumps(
        {"pinataContent": metadata, "pinataMetadata": {"name": name}}
    ).encode()
    req = urllib.request.Request(
        PINATA_JSON,
        data=body,
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
        cid = data.get("IpfsHash") or data.get("cid")
        return {
            "ok": True,
            "cid": cid,
            "uri": f"ipfs://{cid}" if cid else None,
            "gateway_url": f"{GATEWAY}{cid}" if cid else None,
            "raw": data,
        }
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": f"HTTP {e.code}: {e.read()[:200]!r}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def validate_youtube_url(url: str) -> dict[str, Any]:
    u = (url or "").strip()
    if not u:
        return {"ok": True, "empty": True}
    allowed = ("youtube.com/", "youtu.be/")
    if not any(a in u for a in allowed):
        return {"ok": False, "error": "URL must be youtube.com or youtu.be"}
    return {
        "ok": True,
        "url": u,
        "role": "external_link_only",
        "warning": "Not used as NFT binary; pin a copy on IPFS for buyers",
    }


def prepare_artist_package(
    *,
    name: str,
    description: str = "",
    media_kind: str = "image",
    mode: str = "digital",
    image_uri: str = "",
    animation_uri: str = "",
    youtube_url: str = "",
    pin: bool = False,
) -> dict[str, Any]:
    yt = validate_youtube_url(youtube_url)
    if youtube_url and not yt.get("ok"):
        return {"ok": False, "error": yt.get("error")}
    if media_kind in ("video", "audio") and not animation_uri and mode == "digital":
        note = "Provide IPFS animation_url for video/audio sale media"
    else:
        note = None
    meta = build_nft_metadata(
        name=name,
        description=description,
        image_uri=image_uri,
        animation_uri=animation_uri,
        media_kind=media_kind,
        mode=mode,
        youtube_url=youtube_url if yt.get("ok") and not yt.get("empty") else "",
    )
    result: dict[str, Any] = {
        "ok": True,
        "metadata": meta,
        "youtube": yt,
        "storage": storage_status(),
        "note": note,
    }
    if pin:
        result["pin"] = pin_json_pinata(meta, name=f"xartists-{name[:32]}")
    return result


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--name", default="Test Work")
    p.add_argument("--youtube", default="")
    p.add_argument("--pin", action="store_true")
    args = p.parse_args()
    print(
        json.dumps(
            prepare_artist_package(
                name=args.name, youtube_url=args.youtube, pin=args.pin
            ),
            indent=2,
        )
    )
