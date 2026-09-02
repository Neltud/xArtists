"""Paper liquidity rebalance cycle — Vellum-safe (no live bridges)."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "liquidity_cycle.json"

MIN_PROFIT_THRESHOLD = 0.05  # 5%


@dataclass
class Imbalance:
    source_chain: str
    target_chain: str
    asset: str
    imbalance_score: float


def monitor_dex_prices_paper() -> list[Imbalance]:
    """Stub imbalances for paper — replace with oracle/DEX reads."""
    return [
        Imbalance("multiversx", "ethereum", "USDC", 0.12),
        Imbalance("multiversx", "multiversx", "EGLD", 0.05),
    ]


def bridge_cost_paper(src: str, dst: str) -> float:
    if src == dst:
        return 0.0
    return 8.0  # USD-ish stub


def run_cycle(live: bool = False) -> dict[str, Any]:
    """Run one rebalance cycle. live=False → never execute bridges."""
    actions: list[dict[str, Any]] = []
    for imb in monitor_dex_prices_paper():
        if imb.imbalance_score <= 0.2:
            continue
        cost = bridge_cost_paper(imb.source_chain, imb.target_chain)
        potential_gain = imb.imbalance_score * 100
        profitable = potential_gain > cost * (1 + MIN_PROFIT_THRESHOLD)
        actions.append(
            {
                "imbalance": asdict(imb),
                "cost_usd_stub": cost,
                "potential_gain_stub": potential_gain,
                "profitable": profitable,
                "executed": False,
                "reason": "paper_only" if not live else "live_disabled_until_bridge_health",
            }
        )
    payload = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "mode": "paper",
        "min_profit_threshold": MIN_PROFIT_THRESHOLD,
        "actions": actions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


if __name__ == "__main__":
    print(json.dumps(run_cycle(), indent=2))
