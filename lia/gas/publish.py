"""Write data/mvx_gas.json + portfolio gas sim sample."""
from __future__ import annotations

import json
from pathlib import Path

from lia.gas.mvx_gas import cost_table, simulate_portfolio_with_gas
from lia.venues.onchain_feeds import mvx_economics

ROOT = Path(__file__).resolve().parents[2]


def publish() -> Path:
    econ = mvx_economics()
    egld_usd = float(econ.get("egld_price_usd") or 0)
    table = cost_table(egld_usd=egld_usd)
    sim = simulate_portfolio_with_gas(start_usd=100.0, days=30, egld_usd=egld_usd or 20.0)
    out = {**table, "portfolio_sim_sample": sim}
    path = ROOT / "data" / "mvx_gas.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    for rel in ("apps/frontend/public/data/mvx_gas.json", "public/data/mvx_gas.json"):
        dest = ROOT / rel
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return path


if __name__ == "__main__":
    print("wrote", publish())
