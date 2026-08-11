#!/usr/bin/env python3
"""CodeHash Protocol — local wasm SHA-256 fingerprint (Verify before Deploy)."""
from __future__ import annotations

import argparse
import hashlib
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts"
OUT = ROOT / "data" / "codehash_manifest.json"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def find_wasm(name: str) -> Path | None:
    out = CONTRACTS / name / "output"
    if not out.is_dir():
        return None
    cands = sorted(out.glob("*.wasm"))
    return cands[0] if cands else None


def record(name: str) -> dict:
    wasm = find_wasm(name)
    if wasm is None:
        return {
            "contract": name,
            "ok": False,
            "error": "wasm missing — run ./scripts/build_scs_isolated.sh " + name,
        }
    digest = sha256_file(wasm)
    return {
        "contract": name,
        "ok": True,
        "wasm_path": str(wasm.relative_to(ROOT)),
        "wasm_bytes": wasm.stat().st_size,
        "wasm_sha256": digest,
        "note": "Local artifact fingerprint; after deploy set on-chain codeHash via verify script",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--contract", action="append", dest="contracts", default=[])
    ap.add_argument("--all-local", action="store_true")
    args = ap.parse_args()
    names = list(args.contracts)
    if args.all_local or not names:
        names = [
            "nft-marketplace",
            "agents-marketplace",
            "treasury-splitter",
            "tro-burn",
            "rwa-escrow-bridge",
        ]
    entries = [record(n) for n in names]
    payload = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "protocol": "Verify → Deploy → Release",
        "entries": entries,
        "frontend_hint": {
            "rule": "ScStatusBanner live only if contracts.json verification.codeHash non-null",
            "never_remove_banner_until": "codeHash verified on mainnet",
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))
    return 0 if all(e.get("ok") for e in entries) else 1


if __name__ == "__main__":
    raise SystemExit(main())
