"""
Profit lock ledger — prevent death-spiral re-risking of locked gains.
====================================================================
Treasury-aligned: locked PnL can feed Mission/Reserve split off-line;
compound sleeve only spends compoundable_usd.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ProfitLedger:
    locked_usd: float = 0.0
    compoundable_usd: float = 0.0
    lifetime_realized_net: float = 0.0
    lockdown_count: int = 0
    updated: float = field(default_factory=time.time)

    def credit(self, net_usd: float, lock_ratio: float = 0.70) -> dict[str, float]:
        if net_usd <= 0:
            return {"locked": 0.0, "compoundable": 0.0}
        lock_ratio = max(0.0, min(1.0, lock_ratio))
        locked = net_usd * lock_ratio
        comp = net_usd - locked
        self.locked_usd += locked
        self.compoundable_usd += comp
        self.lifetime_realized_net += net_usd
        self.updated = time.time()
        return {"locked": locked, "compoundable": comp}

    def debit_compound(self, amount: float) -> float:
        """Spend from compoundable only; returns amount actually granted."""
        amt = max(0.0, min(amount, self.compoundable_usd))
        self.compoundable_usd -= amt
        self.updated = time.time()
        return amt

    def force_lockdown(self) -> float:
        moved = self.compoundable_usd
        self.locked_usd += moved
        self.compoundable_usd = 0.0
        self.lockdown_count += 1
        self.updated = time.time()
        return moved

    def to_dict(self) -> dict[str, Any]:
        return {
            "locked_usd": round(self.locked_usd, 6),
            "compoundable_usd": round(self.compoundable_usd, 6),
            "lifetime_realized_net": round(self.lifetime_realized_net, 6),
            "lockdown_count": self.lockdown_count,
            "updated": self.updated,
        }

    def save(self, path: str | Path = "data/lia_profit_lock.json") -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path = "data/lia_profit_lock.json") -> "ProfitLedger":
        p = Path(path)
        if not p.exists():
            return cls()
        raw = json.loads(p.read_text(encoding="utf-8"))
        return cls(
            locked_usd=float(raw.get("locked_usd", 0)),
            compoundable_usd=float(raw.get("compoundable_usd", 0)),
            lifetime_realized_net=float(raw.get("lifetime_realized_net", 0)),
            lockdown_count=int(raw.get("lockdown_count", 0)),
            updated=float(raw.get("updated", time.time())),
        )


def credit_for_equity(
    ledger: "ProfitLedger",
    net_usd: float,
    equity_usd: float,
    *,
    start: float = 3.0,
    goal: float = 1_000_000.0,
) -> dict[str, float]:
    """Adaptive lock ratio from million_path phase (70% default mid-path)."""
    try:
        from lia.circuit.million_path import adaptive_lock_ratio

        ratio = adaptive_lock_ratio(equity_usd, start, goal)
    except Exception:
        ratio = 0.70
    return ledger.credit(net_usd, lock_ratio=ratio)
