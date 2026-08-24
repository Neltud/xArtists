"""Paper compounding: 10 echelons, S05/S1/S2, fees+gas."""
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

STRATS = {
    "S05": {"tp": 0.005, "sl": 0.0035},
    "S1": {"tp": 0.01, "sl": 0.005},
    "S2": {"tp": 0.02, "sl": 0.01},
}
FEE_BPS_RT = 30
GAS_USD = 0.04
START = 1000.0


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def simulate_leg(equity: float, strat: str, rng: random.Random) -> dict:
    s = STRATS[strat]
    size = min(max(equity * 0.05, 1.0), 80.0)
    win = rng.random() < 0.55
    gross = size * (s["tp"] if win else -s["sl"])
    fee = size * (FEE_BPS_RT / 10_000)
    net = gross - fee - GAS_USD
    return {
        "strategy": strat,
        "size_usd": round(size, 4),
        "pnl_gross_usd": round(gross, 4),
        "fee_usd": round(fee, 4),
        "gas_usd": GAS_USD,
        "pnl_net_usd": round(net, 4),
        "win": win,
    }


def run(n_legs_per_echelon: int = 10, seed: int | None = 42) -> dict:
    rng = random.Random(seed)
    echelons = []
    all_pnls: list[float] = []
    trade_rows = []

    for i in range(1, 11):
        eid = f"E{i}"
        eq = START
        peak = START
        wins = losses = 0
        curve = [{"t": 0, "equity": eq}]
        last = None
        for t in range(1, n_legs_per_echelon + 1):
            strat = rng.choice(list(STRATS.keys()))
            leg = simulate_leg(eq, strat, rng)
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
                    "id": f"paper-{eid}-{strat}-{t:03d}",
                    "ts": _now(),
                    "echelon": eid,
                    "pair": rng.choice(["WEGLD/USDC", "TRO/USDC", "MEX/USDC"]),
                    "side": "BUY" if leg["win"] else "SELL",
                    "status": "closed_tp" if leg["win"] else "closed_sl",
                    "strategy": strat,
                    "size_usd": leg["size_usd"],
                    "fee_usd": leg["fee_usd"],
                    "gas_usd": leg["gas_usd"],
                    "pnl_net_usd": leg["pnl_net_usd"],
                    "paper": True,
                }
            )
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
                "curve": curve,
            }
        )

    agg_eq = sum(e["equity_usd"] for e in echelons)
    agg_pnl = sum(e["net_pnl_usd"] for e in echelons)
    var = statistics.pvariance(all_pnls) if len(all_pnls) > 1 else 0.0
    wins_n = sum(1 for p in all_pnls if p > 0)

    assert len(echelons) == 10
    assert all(len(e["curve"]) == n_legs_per_echelon + 1 for e in echelons)
    assert len(all_pnls) == 10 * n_legs_per_echelon

    payload = {
        "schema": "xartists.compounding.echelons.v1",
        "updated": _now(),
        "mode": "paper",
        "live_trading": False,
        "note": "Simulated paper echelons. Not user funds.",
        "assumptions": {
            "fee_bps_roundtrip": FEE_BPS_RT,
            "gas_usd_per_leg": GAS_USD,
            "strategies": {
                "S05": {"tp_pct": 0.5, "sl_pct": 0.35},
                "S1": {"tp_pct": 1.0, "sl_pct": 0.5},
                "S2": {"tp_pct": 2.0, "sl_pct": 1.0},
            },
            "profit_sink": "USDC",
        },
        "echelons": echelons,
        "aggregate": {
            "equity_usd": round(agg_eq, 4),
            "net_pnl_usd": round(agg_pnl, 4),
            "trades": len(all_pnls),
            "win_rate": round(wins_n / len(all_pnls), 4) if all_pnls else None,
            "variance_pnl": round(var, 6),
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
                "note": "From lia.compounding.simulate_paper",
                "trades": trade_rows[-30:],
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
        "compounding:",
        "echelons", len(p["echelons"]),
        "trades", a["trades"],
        "equity", a["equity_usd"],
        "pnl", a["net_pnl_usd"],
        "win_rate", a["win_rate"],
        "var", a["variance_pnl"],
    )
    p2 = run(10, 42)
    assert p2["aggregate"]["net_pnl_usd"] == p["aggregate"]["net_pnl_usd"]
    print("compounding: deterministic seed OK")
