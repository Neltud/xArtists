"""Multi-cycle lab for swarm↔compound bridge."""
from __future__ import annotations

import math
import random
from typing import Any, Optional

from lia.agents.swarm_compound_bridge import run_integrated_cycle
from lia.circuit.compound_engine import CircuitConfig, CompoundCircuit


def run_n_integrated(
    n: int = 20,
    *,
    start_equity: float = 100.0,
    seed_market: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Multi-cycle integrated stress (paper)."""
    circuit = CompoundCircuit(
        config=CircuitConfig(
            cooldown_sec_after_loss=0,
            cooldown_sec_after_win=0,
            max_consecutive_losses=10,
        ),
        state_path="data/lia_compound_streak_bridge.json",
    )
    try:
        if circuit.state_path.exists():
            circuit.state_path.unlink()
    except Exception:
        pass
    circuit = CompoundCircuit(
        config=CircuitConfig(
            cooldown_sec_after_loss=0,
            cooldown_sec_after_win=0,
            max_consecutive_losses=10,
        ),
        state_path="data/lia_compound_streak_bridge.json",
    )
    equity = start_equity
    results = []
    base = dict(seed_market or {})
    base.setdefault("token", "WEGLD-bd4d79")
    base.setdefault("liquidity_usd", 150_000)
    base.setdefault("fear_greed", 50)

    for i in range(n):
        drift = math.sin(i / 9.0) * 0.03
        price = float(base.get("price") or 10.0) * (
            1.0 + drift + (random.Random(i).random() - 0.5) * 0.01
        )
        m = {
            **base,
            "price": round(price, 6),
            "vwap_24h": round(price * 0.995, 6),
            "rsi_14": 40 + 20 * math.sin(i / 7.0),
            "trend_7d_pct": drift * 100,
            "price_change_1h": drift * 10,
            "gs_bias": "BULL" if drift > 0 else "NEUTRAL",
        }
        book = {
            "equity_usd": equity,
            "deployable_usd": equity * 0.4,
            "drawdown": 0.0,
            "consecutive_losses": circuit.streak.consecutive_losses,
            "consecutive_wins": circuit.streak.consecutive_wins,
        }
        r = run_integrated_cycle(
            market=m,
            book=book,
            circuit=circuit,
            simulate_fill=circuit.open_ticket is None,
            persist_circuit=True,
        )
        if r.get("close") and r["close"].get("net_pnl_usd") is not None:
            equity += float(r["close"]["net_pnl_usd"])
            circuit.streak.peak_equity_usd = max(circuit.streak.peak_equity_usd, equity)
            circuit.streak.compound_equity_usd = max(
                circuit.streak.compound_equity_usd, circuit.streak.compound_usd
            )
        results.append(
            {
                "i": i,
                "action": (r.get("decision") or {}).get("action"),
                "lead": (r.get("decision") or {}).get("lead_agent"),
                "opened": r.get("opened"),
                "pnl": (r.get("close") or {}).get("net_pnl_usd"),
                "equity": round(equity, 4),
                "phase": (r.get("circuit_after") or {}).get("phase"),
            }
        )

    return {
        "cycles": n,
        "start_equity": start_equity,
        "end_equity": round(equity, 4),
        "return_pct": round(100.0 * (equity - start_equity) / start_equity, 4),
        "health": circuit.health(),
        "tail": results[-10:],
        "opens": sum(1 for x in results if x.get("opened")),
        "closes": sum(1 for x in results if x.get("pnl") is not None),
    }
