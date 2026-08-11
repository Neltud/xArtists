#!/usr/bin/env python3
"""
P1 Pinata proxy — JWT from environment only (never VITE / front bundle).

  export PINATA_JWT=...
  python scripts/pinata_proxy_local.py --file ./oeuvre.jpg

Returns CID + ipfs:// URI for Studio metadata / mint.
For production: put the same logic behind auth (Cloudflare Worker / Vellum node).
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import urllib.request
from pathlib import Path

PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"


def pin_file(path: Path, jwt: str) -> dict:
    boundary = "----xArtistsPinataBoundary"
    data = path.read_bytes()
    ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        PINATA_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {jwt}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, type=Path)
    args = ap.parse_args()
    jwt = os.environ.get("PINATA_JWT", "").strip()
    if not jwt:
        print("Set PINATA_JWT in env (ops secret). Never commit JWT.", file=sys.stderr)
        return 1
    if not args.file.is_file():
        print("File not found", args.file, file=sys.stderr)
        return 1

    res = pin_file(args.file, jwt)
    cid = res.get("IpfsHash") or res.get("IpfsHash".lower()) or res.get("cid")
    out = {
        "IpfsHash": cid,
        "uri": f"ipfs://{cid}" if cid else None,
        "gateway": f"https://gateway.pinata.cloud/ipfs/{cid}" if cid else None,
        "raw": res,
    }
    print(json.dumps(out, indent=2))
    return 0 if cid else 2


if __name__ == "__main__":
    raise SystemExit(main())
