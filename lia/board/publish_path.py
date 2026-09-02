"""Publish data/lia_million_path.json for Portfolio / Board UI."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def publish(equity_usd: float = 3.0, out: str | Path | None = None) -> dict:
    from lia.circuit.million_path import path_status

    status = path_status(equity_usd)
    path = Path(out) if out else ROOT / "data" / "lia_million_path.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(status, indent=2), encoding="utf-8")
    pub = ROOT / "apps" / "frontend" / "public" / "data" / "lia_million_path.json"
    if pub.parent.exists():
        pub.write_text(json.dumps(status, indent=2), encoding="utf-8")
    return {"path": str(path), "updated": status["ts"], "phase": status["phase"]}


if __name__ == "__main__":
    import os

    eq = float(os.environ.get("LIA_EQUITY_USD", "3"))
    print(json.dumps(publish(eq), indent=2))
