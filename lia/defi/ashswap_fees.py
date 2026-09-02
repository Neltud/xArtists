"""
AshSwap / MVX DEX fee model for LIA edge checks.

AshSwap acts as aggregator across xExchange, OneDex, Ash pools.
Exact on-chain fees vary by pool; we use conservative round-trip defaults
aligned with micro_trade / compound FeeModel (not marketing APYs).
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Optional


@dataclass
class DexFeeSchedule:
    protocol: str
    swap_fee_one_way: float  # pool fee e.g. 0.003 = 0.3%
    aggregator_extra: float  # routing premium if any
    gas_usd: float
    max_slippage: float
    safety_buffer: float

    def one_way_cost(self, notional_usd: float) -> float:
        gas_pct = self.gas_usd / max(notional_usd, 0.01)
        return self.swap_fee_one_way + self.aggregator_extra + gas_pct + self.max_slippage + self.safety_buffer

    def roundtrip_cost(self, notional_usd: float) -> float:
        # two swaps; gas often paid twice on MVX
        return self.one_way_cost(notional_usd) + self.swap_fee_one_way + self.aggregator_extra + (
            self.gas_usd / max(notional_usd, 0.01)
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# Conservative defaults (tune via env / DataHub later)
ASHSWAP = DexFeeSchedule("ashswap_agg", 0.0025, 0.0005, 0.05, 0.003, 0.002)
XEXCHANGE = DexFeeSchedule("xexchange", 0.003, 0.0, 0.05, 0.003, 0.002)
ONEDEX = DexFeeSchedule("onedex", 0.003, 0.0, 0.05, 0.003, 0.002)

SCHEDULES = {"ashswap": ASHSWAP, "xexchange": XEXCHANGE, "onedex": ONEDEX}


def best_route_cost(
    notional_usd: float,
    *,
    protocols: Optional[list[str]] = None,
) -> dict[str, Any]:
    names = protocols or list(SCHEDULES.keys())
    rows = []
    for n in names:
        sch = SCHEDULES.get(n)
        if not sch:
            continue
        rt = sch.roundtrip_cost(notional_usd)
        rows.append(
            {
                "protocol": n,
                "roundtrip_pct": round(rt, 6),
                "one_way_pct": round(sch.one_way_cost(notional_usd), 6),
                "schedule": sch.to_dict(),
            }
        )
    rows.sort(key=lambda x: x["roundtrip_pct"])
    best = rows[0] if rows else None
    return {"best": best, "all": rows, "notional_usd": notional_usd}


def edge_after_fees(
    gross_edge_pct: float,
    notional_usd: float,
    protocol: str = "ashswap",
) -> dict[str, Any]:
    sch = SCHEDULES.get(protocol, ASHSWAP)
    cost = sch.roundtrip_cost(notional_usd)
    net = gross_edge_pct - cost
    return {
        "gross_edge_pct": gross_edge_pct,
        "fee_roundtrip_pct": round(cost, 6),
        "net_edge_pct": round(net, 6),
        "ok": net > 0,
        "protocol": protocol,
        "min_gross_for_1pct_net": round(cost + 0.01, 6),
    }


if __name__ == "__main__":
    print(best_route_cost(20))
    print(edge_after_fees(0.02, 20, "ashswap"))
