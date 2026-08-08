"""
Bridge latency optimization — model, measure, route, abort.
===========================================================
Goal: minimize *economic* latency cost of cross-chain arb without
assuming atomic bridges or moving user funds blindly.

Strategies (ordered by effective latency):
  1. INVENTORY_PREPOSITION — already have size on both legs (0 bridge wait)
  2. FAST_CORRIDOR        — pick lowest p95 route
  3. PARALLEL_PREP        — build both leg txs while quotes are hot
  4. EDGE_DECAY_ABORT     — cancel if ETA > max_latency or edge dies

Live bridge adapters remain experimental; default is PAPER + metrics.
"""
from __future__ import annotations

import json
import math
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional


# Vol proxy: bps of edge risk per second of latency (conservative)
EDGE_DECAY_BPS_PER_SEC = float(os.getenv("LIA_EDGE_DECAY_BPS_PER_SEC", "0.8"))
MAX_BRIDGE_LATENCY_SEC = float(os.getenv("LIA_MAX_BRIDGE_LATENCY_SEC", "90"))
TARGET_LATENCY_SEC = float(os.getenv("LIA_TARGET_BRIDGE_LATENCY_SEC", "12"))


@dataclass
class CorridorStats:
    src: str
    dst: str
    route_id: str
    # empirical or calibrated defaults (seconds)
    p50_sec: float
    p95_sec: float
    fee_bps: float
    reliability: float = 0.95  # 0..1
    samples: int = 0
    last_updated: float = field(default_factory=time.time)

    @property
    def key(self) -> str:
        return f"{self.src}->{self.dst}:{self.route_id}"


# Calibrated starting points (update via record_sample)
DEFAULT_CORRIDORS: list[CorridorStats] = [
    CorridorStats("multiversx", "solana", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("solana", "multiversx", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("multiversx", "hyperliquid", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("hyperliquid", "multiversx", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("solana", "hyperliquid", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("hyperliquid", "solana", "inventory", 0.0, 0.5, 0.0, 0.99),
    # CEX-like hop / future message bridge (slow)
    CorridorStats("multiversx", "solana", "msg_bridge_v0", 45.0, 120.0, 25.0, 0.85),
    CorridorStats("solana", "multiversx", "msg_bridge_v0", 45.0, 120.0, 25.0, 0.85),
    CorridorStats("multiversx", "hyperliquid", "msg_bridge_v0", 60.0, 150.0, 30.0, 0.80),
    CorridorStats("hyperliquid", "multiversx", "msg_bridge_v0", 60.0, 150.0, 30.0, 0.80),
    CorridorStats("solana", "hyperliquid", "native_fast", 8.0, 25.0, 10.0, 0.92),
    CorridorStats("hyperliquid", "solana", "native_fast", 8.0, 25.0, 10.0, 0.92),
]


@dataclass
class InventoryBook:
    """Pre-positioned notionals per chain (USD). Fastest path = use inventory."""

    balances: dict[str, float] = field(default_factory=dict)

    def available(self, chain: str) -> float:
        return max(0.0, float(self.balances.get(chain, 0.0)))

    def can_cover(self, chain: str, size_usd: float) -> bool:
        return self.available(chain) >= size_usd * 0.98

    def reserve(self, chain: str, size_usd: float) -> bool:
        if not self.can_cover(chain, size_usd):
            return False
        self.balances[chain] = self.available(chain) - size_usd
        return True

    def credit(self, chain: str, size_usd: float) -> None:
        self.balances[chain] = self.available(chain) + max(0.0, size_usd)

    def to_dict(self) -> dict[str, float]:
        return dict(self.balances)


class BridgeLatencyOptimizer:
    def __init__(
        self,
        *,
        state_path: str = "data/bridge_latency_stats.json",
        inventory: Optional[InventoryBook] = None,
    ):
        self.state_path = Path(state_path)
        self.corridors: dict[str, CorridorStats] = {}
        for c in DEFAULT_CORRIDORS:
            self.corridors[c.key] = c
        self.inventory = inventory or InventoryBook()
        self._load()

    def _load(self) -> None:
        if not self.state_path.exists():
            return
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            for row in raw.get("corridors", []):
                c = CorridorStats(**row)
                self.corridors[c.key] = c
            if "inventory" in raw:
                self.inventory = InventoryBook(balances=raw["inventory"])
        except Exception:
            pass

    def save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "corridors": [c.__dict__ for c in self.corridors.values()],
            "inventory": self.inventory.to_dict(),
        }
        self.state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def record_sample(
        self,
        src: str,
        dst: str,
        route_id: str,
        latency_sec: float,
        *,
        fee_bps: Optional[float] = None,
        success: bool = True,
    ) -> CorridorStats:
        key = f"{src}->{dst}:{route_id}"
        c = self.corridors.get(key) or CorridorStats(
            src, dst, route_id, latency_sec, latency_sec * 1.5, fee_bps or 20.0
        )
        # EWMA-ish update
        alpha = 0.25 if c.samples > 5 else 0.5
        c.p50_sec = (1 - alpha) * c.p50_sec + alpha * latency_sec
        # rough p95: max with decay toward sample*1.4
        target_p95 = max(latency_sec * 1.4, c.p50_sec * 1.8)
        c.p95_sec = (1 - alpha * 0.7) * c.p95_sec + (alpha * 0.7) * target_p95
        if fee_bps is not None:
            c.fee_bps = (1 - alpha) * c.fee_bps + alpha * fee_bps
        c.samples += 1
        c.reliability = min(0.99, c.reliability * 0.98 + (0.02 if success else 0.0))
        if not success:
            c.reliability = max(0.5, c.reliability - 0.05)
        c.last_updated = time.time()
        self.corridors[key] = c
        self.save()
        return c

    def list_routes(self, src: str, dst: str) -> list[CorridorStats]:
        return [c for c in self.corridors.values() if c.src == src and c.dst == dst]

    def best_route(
        self,
        src: str,
        dst: str,
        *,
        size_usd: float,
        prefer_inventory: bool = True,
    ) -> dict[str, Any]:
        """Pick route minimizing latency cost + fee, with inventory short-circuit."""
        if src == dst:
            return {
                "ok": True,
                "mode": "SAME_CHAIN",
                "latency_p50": 0.0,
                "latency_p95": 0.0,
                "fee_bps": 0.0,
                "penalty_bps": 0.0,
                "route_id": "local",
            }

        # 1) Inventory: if we already hold on dst, no bridge wait for sell leg
        if prefer_inventory and self.inventory.can_cover(dst, size_usd):
            return {
                "ok": True,
                "mode": "INVENTORY_PREPOSITION",
                "latency_p50": 0.0,
                "latency_p95": 0.3,
                "fee_bps": 0.0,
                "penalty_bps": self.latency_penalty_bps(0.3),
                "route_id": "inventory",
                "note": "Use pre-positioned inventory on destination — fastest path",
            }

        routes = self.list_routes(src, dst)
        if not routes:
            # fallback synthetic slow
            return {
                "ok": False,
                "mode": "NO_ROUTE",
                "latency_p50": 180.0,
                "latency_p95": 300.0,
                "fee_bps": 50.0,
                "penalty_bps": self.latency_penalty_bps(300.0) + 50.0,
                "route_id": "none",
            }

        def score(c: CorridorStats) -> float:
            # lower is better: p95 latency cost + fee + unreliability
            lat_pen = self.latency_penalty_bps(c.p95_sec)
            risk = (1.0 - c.reliability) * 40.0
            return lat_pen + c.fee_bps + risk

        best = min(routes, key=score)
        lat_pen = self.latency_penalty_bps(best.p95_sec)
        return {
            "ok": best.p95_sec <= MAX_BRIDGE_LATENCY_SEC and best.reliability >= 0.75,
            "mode": "FAST_CORRIDOR",
            "latency_p50": best.p50_sec,
            "latency_p95": best.p95_sec,
            "fee_bps": best.fee_bps,
            "penalty_bps": lat_pen + best.fee_bps,
            "route_id": best.route_id,
            "reliability": best.reliability,
            "samples": best.samples,
            "within_budget": best.p95_sec <= MAX_BRIDGE_LATENCY_SEC,
        }

    @staticmethod
    def latency_penalty_bps(latency_sec: float) -> float:
        """Convert time risk into edge bps (decay + floor)."""
        lat = max(0.0, latency_sec)
        # concave: first seconds costly, then linear
        return EDGE_DECAY_BPS_PER_SEC * lat + 5.0 * math.sqrt(lat)

    def edge_survives(
        self,
        net_edge: float,
        *,
        latency_p95: float,
        extra_bps: float = 0.0,
    ) -> dict[str, Any]:
        """Will net edge still be positive after waiting p95 latency?"""
        decay = self.latency_penalty_bps(latency_p95) / 10_000.0
        extra = extra_bps / 10_000.0
        remaining = net_edge - decay - extra
        return {
            "survives": remaining > 0.0015,  # 15 bps floor
            "remaining_edge": round(remaining, 6),
            "decay": round(decay, 6),
            "latency_p95": latency_p95,
            "abort": remaining <= 0.0015 or latency_p95 > MAX_BRIDGE_LATENCY_SEC,
        }

    def plan_parallel_legs(
        self,
        *,
        buy_chain: str,
        sell_chain: str,
        size_usd: float,
        net_edge: float,
    ) -> dict[str, Any]:
        """Optimize path: inventory first, else best corridor + parallel prep."""
        t0 = time.time()
        route = self.best_route(buy_chain, sell_chain, size_usd=size_usd)
        survival = self.edge_survives(
            net_edge,
            latency_p95=float(route.get("latency_p95") or 999),
            extra_bps=float(route.get("fee_bps") or 0),
        )

        # Parallel prep timeline (paper)
        timeline = [
            {"t_ms": 0, "step": "LOCK_QUOTES"},
            {"t_ms": 5, "step": "BUILD_BUY_TX"},
            {"t_ms": 5, "step": "BUILD_SELL_TX"},  # parallel with buy
            {"t_ms": 15, "step": "SIMULATE_BOTH"},
        ]
        if route.get("mode") == "INVENTORY_PREPOSITION":
            timeline.append({"t_ms": 20, "step": "EXECUTE_BOTH_LEGS_NO_BRIDGE"})
        else:
            timeline.append({"t_ms": 25, "step": "EXECUTE_BUY"})
            timeline.append(
                {
                    "t_ms": 25 + int(1000 * float(route.get("latency_p50") or 0)),
                    "step": "BRIDGE_OR_WAIT",
                }
            )
            timeline.append(
                {
                    "t_ms": 25 + int(1000 * float(route.get("latency_p95") or 0)),
                    "step": "EXECUTE_SELL_OR_ABORT",
                }
            )

        return {
            "route": route,
            "survival": survival,
            "execute": bool(route.get("ok") and not survival["abort"]),
            "mode": route.get("mode"),
            "timeline": timeline,
            "plan_ms": int((time.time() - t0) * 1000),
            "target_latency_sec": TARGET_LATENCY_SEC,
            "max_latency_sec": MAX_BRIDGE_LATENCY_SEC,
            "recommendation": (
                "PREPOSITION_INVENTORY"
                if route.get("mode") != "INVENTORY_PREPOSITION"
                else "USE_INVENTORY"
            ),
        }


def adaptive_bridge_penalty_bps(
    src: str,
    dst: str,
    *,
    size_usd: float = 25.0,
    optimizer: Optional[BridgeLatencyOptimizer] = None,
) -> dict[str, Any]:
    """Replace fixed LIA_BRIDGE_PENALTY_BPS with latency-aware penalty."""
    opt = optimizer or BridgeLatencyOptimizer()
    route = opt.best_route(src, dst, size_usd=size_usd)
    # floor 15 bps even for inventory (execution risk)
    penalty = max(15.0, float(route.get("penalty_bps") or 80.0))
    return {"penalty_bps": int(round(penalty)), **route}
