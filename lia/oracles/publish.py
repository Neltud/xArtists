"""Publish oracle_prices.json + mirrors for Pages / Vellum."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from lia.oracles.price_oracle import PriceOracle

ROOT = Path(__file__).resolve().parents[2]


def publish() -> Path:
    result = PriceOracle().run(persist=True, multi=True)
    src = ROOT / "data" / "oracle_prices.json"
    for rel in (
        "apps/frontend/public/data/oracle_prices.json",
        "docs/data/oracle_prices.json",
        "public/data/oracle_prices.json",
    ):
        dest = ROOT / rel
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        except OSError:
            pass
    # also mirror egld_price
    egld = ROOT / "data" / "egld_price.json"
    if egld.exists():
        for rel in (
            "apps/frontend/public/data/egld_price.json",
            "docs/data/egld_price.json",
        ):
            try:
                d = ROOT / rel
                d.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(egld, d)
            except OSError:
                pass
    print(json.dumps({"wrote": str(src), "egld_usd": result.get("egld_usd")}, indent=2))
    return src


if __name__ == "__main__":
    publish()
