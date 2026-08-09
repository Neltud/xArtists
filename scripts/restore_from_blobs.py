#!/usr/bin/env python3
"""Restore critical modules from data/blobs/*.b64.gz
Usage: python scripts/restore_from_blobs.py
"""
from __future__ import annotations
import base64, gzip, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MAP = {
    "compound_engine.py.b64.gz": "lia/circuit/compound_engine.py",
    "million_path.py.b64.gz": "lia/circuit/million_path.py",
    "preflight.py.b64.gz": "lia/guardian/preflight.py",
    "autonomous_swarm.py.b64.gz": "lia/agents/autonomous_swarm.py",
}
def main() -> int:
    blob_dir = ROOT / "data" / "blobs"
    for name, rel in MAP.items():
        p = blob_dir / name
        if not p.exists():
            print("MISSING", p)
            continue
        data = gzip.decompress(base64.b64decode(p.read_text().strip()))
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        print("wrote", rel, len(data))
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
