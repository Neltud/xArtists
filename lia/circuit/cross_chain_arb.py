"""
Cross-chain arb scanner + gated intents (NOT atomic bridge arb).
================================================================
Latency optimization:
  - Adaptive bridge penalty from BridgeLatencyOptimizer (not fixed 80 bps)
  - Prefer INVENTORY_PREPOSITION (0 wait) over message bridges
  - Edge decay abort if p95 latency kills net edge
  - Parallel leg prep timeline in intents

Live legs only if LIA_LIVE_TRADING=1 AND policy allows AND edge survives.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Optional

from lia.board.arb import scan_block_arb
from lia.bridge.latency import BridgeLatencyOptimizer, InventoryBook, adaptive_bridge_penalty_bps
from lia.risk.leverage_policy import allow_execution
from lia.risk.secure_tp import live_trading_enabled
from lia.risk.slippage import (
    guard_quote,
    net_edge_after_slippage,
    recommended_slippage_bps,
)

MIN_CROSS_EDGE = float(os.getenv("LIA_MIN_CROSS_EDGE", "0.015"))
MAX_ARB_USD = float(os.getenv("LIA_MAX_CROSS_ARB_USD", "25"))
FEE_RT = float(os.getenv("LIA_ARB_FEE_RT", "0.008"))
# Optional fixed floor; adaptive penalty replaces legacy LIA_BRIDGE_PENALTY_BPS when possible
LEGACY_BRIDGE_BPS = int(os.getenv("LIA_BRIDGE_PENALTY_BPS", "80"))

_OPT: Optional[BridgeLatencyOptimizer] = None


def get_bridge_optimizer() -> BridgeLatencyOptimizer:
    global _OPT
    if _OPT is None:
        # Optional bootstrap inventory from env (USD per chain)
        inv = InventoryBook(
            balances={
                "multiversx": float(os.getenv("LIA_INV_MVX_USD", "0") or 0),
                "solana": float(os.getenv("LIA_INV_SOL_USD", "0") or 0),
                "hyperliquid": float(os.getenv("LIA_INV_HL_USD", "0") or 0),
            }
        )
        _OPT = BridgeLatencyOptimizer(
            state_path=os.getenv("LIA_BRIDGE_STATS_PATH", "data/bridge_latency_stats.json"),
            inventory=inv,
        )
    return _OPT


@dataclass
class ChainQuote:
    chain: str
    venue: str
    symbol: str
    mid_usd: float


def _mvx_quotes(token: str = "WEGLD-bd4d79") -> list[ChainQuote]:
    scan = scan_block_arb(token=token)
    out: list[ChainQuote] = []
    for vid, mid in (scan.get("mids") or {}).items():
        if mid and float(mid) > 0:
            out.append(ChainQuote("multiversx", vid, token, float(mid)))
    return out


def _external_quotes(
    *,
    sol_mid: Optional[float] = None,
    hl_mid: Optional[float] = None,
    symbol: str = "EGLD",
) -> list[ChainQuote]:
    out: list[ChainQuote] = []
    if sol_mid and sol_mid > 0:
        out.append(ChainQuote("solana", "jupiter", symbol, float(sol_mid)))
    if hl_mid and hl_mid > 0:
        out.append(ChainQuote("hyperliquid", "hyperliquid", symbol, float(hl_mid)))
    return out


def scan_cross_chain_arb(
    *,
    token_mvx: str = "WEGLD-bd4d79",
    symbol: str = "EGLD",
    sol_mid: Optional[float] = None,
    hl_mid: Optional[float] = None,
    size_usd: float = MAX_ARB_USD,
    atr_pct: float = 0.01,
) -> dict[str, Any]:
    opt = get_bridge_optimizer()
    quotes = _mvx_quotes(token_mvx) + _external_quotes(
        sol_mid=sol_mid, hl_mid=hl_mid, symbol=symbol
    )
    by_chain: dict[str, list[ChainQuote]] = {}
    for q in quotes:
        by_chain.setdefault(q.chain, []).append(q)

    opportunities: list[dict[str, Any]] = []
    chains = list(by_chain.keys())
    for i, ca in enumerate(chains):
        for cb in chains[i + 1 :]:
            for buy_chain, sell_chain in ((ca, cb), (cb, ca)):
                buy_q = min(by_chain[buy_chain], key=lambda x: x.mid_usd)
                sell_q = max(by_chain[sell_chain], key=lambda x: x.mid_usd)
                if buy_q.mid_usd <= 0 or sell_q.mid_usd <= 0:
                    continue
                gross = (sell_q.mid_usd - buy_q.mid_usd) / buy_q.mid_usd
                if gross < MIN_CROSS_EDGE:
                    continue

                cross = buy_chain != sell_chain
                buy_slip = recommended_slippage_bps(
                    notional_usd=size_usd,
                    venue_id=buy_q.venue,
                    atr_pct=atr_pct,
                    cross_chain=cross,
                )
                sell_slip = recommended_slippage_bps(
                    notional_usd=size_usd,
                    venue_id=sell_q.venue,
                    atr_pct=atr_pct,
                    cross_chain=cross,
                )

                # Adaptive latency-aware penalty (inventory → near-zero wait)
                if cross:
                    pen = adaptive_bridge_penalty_bps(
                        buy_chain, sell_chain, size_usd=size_usd, optimizer=opt
                    )
                    bridge_bps = int(pen["penalty_bps"])
                    route_meta = pen
                else:
                    bridge_bps = 0
                    route_meta = {"mode": "SAME_CHAIN", "penalty_bps": 0}

                net = net_edge_after_slippage(
                    gross,
                    buy_slip_bps=buy_slip["slippage_bps"],
                    sell_slip_bps=sell_slip["slippage_bps"],
                    fee_roundtrip=FEE_RT,
                    bridge_bps=bridge_bps,
                )

                plan = opt.plan_parallel_legs(
                    buy_chain=buy_chain,
                    sell_chain=sell_chain,
                    size_usd=size_usd,
                    net_edge=net,
                )
                actionable = bool(net > 0.002 and plan.get("execute"))

                opportunities.append(
                    {
                        "buy": buy_q.__dict__,
                        "sell": sell_q.__dict__,
                        "gross_edge": round(gross, 6),
                        "net_edge": round(net, 6),
                        "buy_slip_bps": buy_slip["slippage_bps"],
                        "sell_slip_bps": sell_slip["slippage_bps"],
                        "bridge_penalty_bps": bridge_bps,
                        "bridge_route": route_meta,
                        "latency_plan": plan,
                        "size_usd": size_usd,
                        "actionable": actionable,
                        "atomic": False,
                        "risk": "sequential_legs_bridge_latency",
                    }
                )

    opportunities.sort(key=lambda x: x["net_edge"], reverse=True)
    best = opportunities[0] if opportunities else None

    return {
        "quotes": [q.__dict__ for q in quotes],
        "opportunities": opportunities[:10],
        "best": best,
        "limits": {
            "min_cross_edge": MIN_CROSS_EDGE,
            "legacy_bridge_penalty_bps": LEGACY_BRIDGE_BPS,
            "max_arb_usd": MAX_ARB_USD,
            "fee_roundtrip": FEE_RT,
            "inventory": opt.inventory.to_dict(),
        },
        "live": live_trading_enabled(),
        "note": (
            "Latency optimized: inventory pre-position > fast corridor > msg bridge. "
            "Edge decay abort if p95 wait kills net. Non-atomic; no auto user-fund bridge."
        ),
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def build_arb_intents(
    opp: dict[str, Any],
    *,
    force_paper: bool = True,
) -> dict[str, Any]:
    if not opp or not opp.get("actionable"):
        return {"ok": False, "reason": "not_actionable", "intents": []}

    buy = opp["buy"]
    sell = opp["sell"]
    size = min(float(opp.get("size_usd") or MAX_ARB_USD), MAX_ARB_USD)
    plan = opp.get("latency_plan") or {}

    if plan and plan.get("survival", {}).get("abort"):
        return {
            "ok": False,
            "reason": "edge_decay_abort",
            "latency_plan": plan,
            "intents": [],
        }

    intents: list[dict[str, Any]] = []
    for leg, side in ((buy, "buy"), (sell, "sell")):
        g = allow_execution(
            chain=leg["chain"],
            venue_id=leg["venue"],
            requested_leverage=1.0,
            strategy="MICRO_ARB",
        )
        slip = guard_quote(
            mid=float(leg["mid_usd"]),
            side=side,
            notional_usd=size,
            venue_id=leg["venue"],
            cross_chain=buy["chain"] != sell["chain"],
        )
        if not slip["ok"]:
            return {"ok": False, "reason": "slippage_cap", "leg": leg, "slip": slip}

        live = live_trading_enabled() and not force_paper and g.get("allow")
        intents.append(
            {
                "type": "ARB_LEG",
                "side": side,
                "chain": leg["chain"],
                "venue": leg["venue"],
                "symbol": leg["symbol"],
                "mid": leg["mid_usd"],
                "limit_price": slip["fill_price"],
                "slippage_bps": slip["slippage_bps"],
                "size_usd": size,
                "execution": "LIVE" if live else "PAPER",
                "gate": g,
            }
        )

    route_mode = (opp.get("bridge_route") or {}).get("mode") or plan.get("mode")
    return {
        "ok": True,
        "atomic": False,
        "bridge_required": buy["chain"] != sell["chain"]
        and route_mode != "INVENTORY_PREPOSITION",
        "bridge_mode": route_mode or "MANUAL_OR_FUTURE_ADAPTER",
        "latency_plan": plan,
        "net_edge": opp.get("net_edge"),
        "intents": intents,
        "warning": (
            "Prefer inventory pre-position to avoid bridge wait. "
            "Do not send user funds across experimental bridges."
        ),
    }


def run_cross_chain_arb_cycle(
    *,
    sol_mid: Optional[float] = None,
    hl_mid: Optional[float] = None,
    force_paper: bool = True,
) -> dict[str, Any]:
    scan = scan_cross_chain_arb(sol_mid=sol_mid, hl_mid=hl_mid)
    best = scan.get("best")
    intents = (
        build_arb_intents(best, force_paper=force_paper)
        if best
        else {"ok": False, "reason": "no_opportunity", "intents": []}
    )
    return {"scan": scan, "intents": intents}
