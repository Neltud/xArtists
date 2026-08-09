"""Publish oracle_prices.json + dex_mids + mirrors for Pages / Vellum."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from lia.oracles.price_oracle import PriceOracle

ROOT = Path(__file__).resolve().parents[2]


def publish() -> Path:
    result = PriceOracle().run(persist=True, multi=True)
    try:
        from lia.oracles.dex_mids import collect_wegld_mids

        dex = collect_wegld_mids()
        result["dex_mids"] = dex
        src0 = ROOT / "data" / "oracle_prices.json"
        if src0.exists():
            blob = json.loads(src0.read_text(encoding="utf-8"))
            blob["dex_mids"] = {
                "ok": dex.get("ok"),
                "dex_a": dex.get("dex_a"),
                "dex_b": dex.get("dex_b"),
                "spread_bps": dex.get("spread_bps"),
                "n_sources": dex.get("n_sources"),
                "same_index_family": dex.get("same_index_family"),
                "block_nonce": (dex.get("block") or {}).get("nonce"),
                "updated": dex.get("updated"),
            }
            src0.write_text(json.dumps(blob, indent=2) + "\n", encoding="utf-8")
    except Exception as e:
        result["dex_mids_error"] = str(e)[:120]

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
    print(
        json.dumps(
            {
                "wrote": str(src),
                "egld_usd": result.get("egld_usd"),
                "dex_spread_bps": (result.get("dex_mids") or {}).get("spread_bps"),
            },
            indent=2,
        )
    )
    return src


if __name__ == "__main__":
    publish()
