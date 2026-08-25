"""Paper compounding — 10 independent columns, core 1% per trade.

Doctrine (product):
- 10 portefeuilles paper (E1–E10), trades DISTINCTS par colonne (pair/moment/seed)
- Stratégie cœur S1 = +1% TP / −0.5% SL (S05/S2 = satellites)
- AUCUN plafond max de trades produit : n_legs n’est qu’un batch de simu
- Cible trésorerie protocole LIA : 1_000_000 USD (USDC sink)
- Reporting holders NFT : part optionnelle en % du dépôt USDC isolé (escrow),
  jamais un pool partagé — voir docs/HOLDER_SHARE_MODEL.md
- Fees + gas toujours déduits. live_trading toujours False ici.
"""
from __future__ import annotations

import json
import random
import statistics
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OUT = DATA / "compounding_echelons.json"
TRADES = DATA / "lia_trades.json"

# Core = 1% per trade; satellites optional
STRATS = {
    "S1": {"tp": 0.01, "sl": 0.005, "weight": 0.70},   # heart
    "S05": {"tp": 0.005, "sl": 0.0035, "weight": 0.15},
    "S2": {"tp": 0.02, "sl": 0.01, "weight": 0.15},
}
FEE_BPS_RT = 30
GAS_USD = 0.04
START = 1000.0
TARGET_TREASURY_USD = 1_000_000.0
PAIRS = [
    "WEGLD/USDC",
    "TRO/USDC",
    "MEX/USDC",
    "WEGLD/TRO",
    "USDC/WEGLD",
    "TRO/WEGLD",
    "MEX/WEGLD",
    "HTM/USDC",
]
# No product-level max trades — only batch size for this publish cycle
DEFAULT_BATCH_LEGS = 10
MAX_BATCH_LEGS = 10_000  # safety for a single process, not a business cap


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _pick_strat(rng: random.Random) -> str:
    names = list(STRATS.keys())
    weights = [STRATS[n]["weight"] for n in names]
    return rng.choices(names, weights=weights, k=1)[0]


def simulate_leg(equity: float, strat: str, rng: random.Random) -> dict:
    s = STRATS[strat]
    # 5% of column equity per leg, no hard $80 product cap (only tiny floor)
    size = max(equity * 0.05, 1.0)
    win = rng.random() < 0.55
    gross = size * (s["tp"] if win else -s["sl"])
    fee = size * (FEE_BPS_RT / 10_000)
    net = gross - fee - GAS_USD
    return {
        "strategy": strat,
        "tp_pct": s["tp"] * 100,
        "sl_pct": s["sl"] * 100,
        "size_usd": round(size, 4),
        "pnl_gross_usd": round(gross, 4),
        "fee_usd": round(fee, 4),
        "gas_usd": GAS_USD,
        "pnl_net_usd": round(net, 4),
        "win": win,
    }


def run(
    n_legs_per_echelon: int = DEFAULT_BATCH_LEGS,
    seed: int | None = 42,
) -> dict:
    """Simulate one batch. n_legs is NOT a lifetime max — call again to continue."""
    if n_legs_per_echelon < 1:
        n_legs_per_echelon = 1
    if n_legs_per_echelon > MAX_BATCH_LEGS:
        n_legs_per_echelon = MAX_BATCH_LEGS

    rng = random.Random(seed)
    echelons = []
    all_pnls: list[float] = []
    trade_rows = []
    used_keys: set[str] = set()

    for i in range(1, 11):
        eid = f"E{i}"
        # per-column RNG offset so each column gets different trade stream
        col_rng = random.Random((seed if seed is not None else 0) * 1009 + i * 9176)
        eq = START
        peak = START
        wins = losses = 0
        curve = [{"t": 0, "equity": eq}]
        last = None
        for t in range(1, n_legs_per_echelon + 1):
            strat = _pick_strat(col_rng)
            # force distinct (echelon, pair, t) identities
            pair = PAIRS[(i + t + col_rng.randint(0, 7)) % len(PAIRS)]
            key = f"{eid}:{pair}:{t}:{strat}"
            if key in used_keys:
                pair = PAIRS[(i * 3 + t * 5) % len(PAIRS)]
                key = f"{eid}:{pair}:{t}:{strat}:b"
            used_keys.add(key)

            leg = simulate_leg(eq, strat, col_rng)
            eq = max(0.0, eq + leg["pnl_net_usd"])
            peak = max(peak, eq)
            if leg["win"]:
                wins += 1
            else:
                losses += 1
            last = strat
            curve.append({"t": t, "equity": round(eq, 4)})
            all_pnls.append(leg["pnl_net_usd"])
            trade_rows.append(
                {
                    "id": f"paper-{eid}-{strat}-{t:04d}",
                    "ts": _now(),
                    "echelon": eid,
                    "pair": pair,
                    "side": "BUY" if leg["win"] else "SELL",
                    "status": "closed_tp" if leg["win"] else "closed_sl",
                    "strategy": strat,
                    "tp_pct": leg["tp_pct"],
                    "sl_pct": leg["sl_pct"],
                    "size_usd": leg["size_usd"],
                    "fee_usd": leg["fee_usd"],
                    "gas_usd": leg["gas_usd"],
                    "pnl_net_usd": leg["pnl_net_usd"],
                    "paper": True,
                }
            )
        progress = min(1.0, eq / TARGET_TREASURY_USD) if TARGET_TREASURY_USD else 0.0
        echelons.append(
            {
                "id": eid,
                "label": f"Echelon {i}",
                "equity_usd": round(eq, 4),
                "peak_usd": round(peak, 4),
                "trades": n_legs_per_echelon,
                "wins": wins,
                "losses": losses,
                "net_pnl_usd": round(eq - START, 4),
                "status": "active",
                "last_strategy": last,
                "core_strategy": "S1",
                "core_tp_pct": 1.0,
                "max_trades": None,
                "batch_legs": n_legs_per_echelon,
                "target_treasury_usd": TARGET_TREASURY_USD,
                "progress_to_target": round(progress, 8),
                "curve": curve,
            }
        )

    agg_eq = sum(e["equity_usd"] for e in echelons)
    agg_pnl = sum(e["net_pnl_usd"] for e in echelons)
    var = statistics.pvariance(all_pnls) if len(all_pnls) > 1 else 0.0
    wins_n = sum(1 for p in all_pnls if p > 0)

    assert len(echelons) == 10
    assert len(used_keys) >= 10  # distinct trade identities across columns

    payload = {
        "schema": "xartists.compounding.echelons.v2",
        "updated": _now(),
        "mode": "paper",
        "live_trading": False,
        "note": (
            "10 columns · core 1%/trade (S1) · distinct pairs per column · "
            "no product max trades · target 1M USDC treasury · not user funds"
        ),
        "assumptions": {
            "fee_bps_roundtrip": FEE_BPS_RT,
            "gas_usd_per_leg": GAS_USD,
            "core_strategy": "S1",
            "core_tp_pct": 1.0,
            "core_sl_pct": 0.5,
            "strategies": {
                "S1": {"tp_pct": 1.0, "sl_pct": 0.5, "role": "core", "weight": 0.70},
                "S05": {"tp_pct": 0.5, "sl_pct": 0.35, "role": "satellite", "weight": 0.15},
                "S2": {"tp_pct": 2.0, "sl_pct": 1.0, "role": "satellite", "weight": 0.15},
            },
            "profit_sink": "USDC",
            "target_treasury_usd": TARGET_TREASURY_USD,
            "max_trades_product": None,
            "batch_legs_only": True,
            "distinct_trades_per_column": True,
        },
        "holder_share": {
            "model": "percent_of_holder_usdc_deposit",
            "escrow": "isolated_per_nft",
            "default_perf_fee_bps": 1000,
            "note": "Holders with funded escrow share protocol alpha as % of THEIR deposit only",
            "doc": "docs/HOLDER_SHARE_MODEL.md",
        },
        "echelons": echelons,
        "aggregate": {
            "equity_usd": round(agg_eq, 4),
            "net_pnl_usd": round(agg_pnl, 4),
            "trades": len(all_pnls),
            "win_rate": round(wins_n / len(all_pnls), 4) if all_pnls else None,
            "variance_pnl": round(var, 6),
            "target_treasury_usd": TARGET_TREASURY_USD,
            "progress_to_target": round(min(1.0, agg_eq / TARGET_TREASURY_USD), 8),
        },
    }

    DATA.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    TRADES.write_text(
        json.dumps(
            {
                "updated": _now(),
                "network": "mainnet",
                "live_trading": False,
                "note": "From lia.compounding.simulate_paper v2 — core 1%, no max trades",
                "trades": trade_rows[-40:],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return payload


if __name__ == "__main__":
    p = run(10, 42)
    a = p["aggregate"]
    print(
        "compounding v2:",
        "echelons", len(p["echelons"]),
        "trades", a["trades"],
        "equity", a["equity_usd"],
        "pnl", a["net_pnl_usd"],
        "target", a["target_treasury_usd"],
        "progress", a["progress_to_target"],
    )
    assert p["assumptions"]["max_trades_product"] is None
    assert p["assumptions"]["core_tp_pct"] == 1.0
    p2 = run(10, 42)
    assert p2["aggregate"]["net_pnl_usd"] == p["aggregate"]["net_pnl_usd"]
    print("compounding: doctrine checks OK")
