"""
Bridge latency optimizer — inventory-first, then lowest p95 corridor.
Experimental: no user funds auto-bridge. Paper / ops only.
"""
from __future__ import annotations

import json
import math
import os
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

EDGE_DECAY_BPS_PER_SEC = float(os.getenv("LIA_BRIDGE_DECAY_BPS_PER_SEC", "0.8"))
MAX_BRIDGE_LATENCY_SEC = float(os.getenv("LIA_MAX_BRIDGE_LATENCY_SEC", "90"))
TARGET_LATENCY_SEC = float(os.getenv("LIA_TARGET_BRIDGE_LATENCY_SEC", "12"))


@dataclass
class CorridorStats:
    src: str
    dst: str
    route_id: str
    p50_sec: float
    p95_sec: float
    fee_bps: float
    reliability: float = 0.95
    samples: int = 0
    last_updated: float = field(default_factory=time.time)

    @property
    def key(self) -> str:
        return f"{self.src}->{self.dst}:{self.route_id}"


DEFAULT_CORRIDORS: list[CorridorStats] = [
    CorridorStats("multiversx", "solana", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("solana", "multiversx", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("multiversx", "hyperliquid", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("hyperliquid", "multiversx", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("solana", "hyperliquid", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("hyperliquid", "solana", "inventory", 0.0, 0.5, 0.0, 0.99),
    CorridorStats("multiversx", "solana", "msg_bridge_v0", 45.0, 120.0, 25.0, 0.85),
    CorridorStats("solana", "multiversx", "msg_bridge_v0", 45.0, 120.0, 25.0, 0.85),
    CorridorStats("multiversx", "hyperliquid", "msg_bridge_v0", 60.0, 150.0, 30.0, 0.80),
    CorridorStats("hyperliquid", "multiversx", "msg_bridge_v0", 60.0, 150.0, 30.0, 0.80),
    CorridorStats("solana", "hyperliquid", "native_fast", 8.0, 25.0, 10.0, 0.92),
    CorridorStats("hyperliquid", "solana", "native_fast", 8.0, 25.0, 10.0, 0.92),
]


@dataclass
class InventoryBook:
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
            "corridors": [asdict(c) for c in self.corridors.values()],
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
        alpha = 0.25 if c.samples > 5 else 0.5
        c.p50_sec = (1 - alpha) * c.p50_sec + alpha * latency_sec
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

        # Exclude inventory pseudo-routes when balances cannot cover
        routes = [c for c in self.list_routes(src, dst) if c.route_id != "inventory"]
        if not routes:
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
        lat = max(0.0, latency_sec)
        return EDGE_DECAY_BPS_PER_SEC * lat + 5.0 * math.sqrt(lat)

    def edge_survives(self, net_edge: float, latency_p95: float) -> dict[str, Any]:
        decay = self.latency_penalty_bps(latency_p95) / 10_000.0
        remaining = net_edge - decay
        return {
            "net_edge": net_edge,
            "decay": decay,
            "remaining": remaining,
            "latency_p95": latency_p95,
            "abort": remaining <= 0.0015 or latency_p95 > MAX_BRIDGE_LATENCY_SEC,
            "survives": remaining > 0.0015 and latency_p95 <= MAX_BRIDGE_LATENCY_SEC,
        }

    def plan_parallel_legs(
        self,
        *,
        buy_chain: str,
        sell_chain: str,
        size_usd: float,
        net_edge: float,
    ) -> dict[str, Any]:
        route = self.best_route(buy_chain, sell_chain, size_usd=size_usd)
        surv = self.edge_survives(
            net_edge, latency_p95=float(route.get("latency_p95") or 999)
        )
        if route.get("mode") == "INVENTORY_PREPOSITION":
            return {
                "execute": True,
                "mode": "INVENTORY_PREPOSITION",
                "route": route,
                "edge": surv,
                "legs": [
                    {
                        "action": "USE_INVENTORY",
                        "chain": sell_chain,
                        "t_ms": 25 + int(1000 * float(route.get("latency_p95") or 0)),
                    }
                ],
            }
        return {
            "execute": bool(surv.get("survives") and route.get("ok")),
            "mode": route.get("mode"),
            "route": route,
            "edge": surv,
            "legs": [
                {
                    "action": "PREPOSITION_INVENTORY"
                    if route.get("mode") != "INVENTORY_PREPOSITION"
                    else "USE_INVENTORY",
                    "chain": sell_chain,
                }
            ],
        }


def adaptive_bridge_penalty_bps(
    src: str,
    dst: str,
    *,
    size_usd: float,
    optimizer: Optional[BridgeLatencyOptimizer] = None,
) -> dict[str, Any]:
    opt = optimizer or BridgeLatencyOptimizer()
    r = opt.best_route(src, dst, size_usd=size_usd)
    return {
        "penalty_bps": float(r.get("penalty_bps") or 80),
        "route": r,
    }
