"""Write data/hatom_lia.json for frontend + Pages mirror."""
from __future__ import annotations

import json
from pathlib import Path

from lia.venues.hatom import sleeve_summary

ROOT = Path(__file__).resolve().parents[2]


def publish(wallet: str | None = None) -> Path:
    from lia.venues.hatom import LIA_WALLET

    summary = sleeve_summary(wallet or LIA_WALLET)
    path = ROOT / "data" / "hatom_lia.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    # best-effort mirrors
    for rel in ("docs/data/hatom_lia.json", "apps/frontend/public/data/hatom_lia.json", "public/data/hatom_lia.json"):
        dest = ROOT / rel
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return path


if __name__ == "__main__":
    p = publish()
    print("wrote", p)
