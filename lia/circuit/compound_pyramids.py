"""
Compound pyramids — multi-strategy sleeves toward N × +1% net.

Goal narrative: ~1000 successful +1% compounds (geometric), but split across
strategies with different cadence and portfolio weights so no single sleeve
blows risk budgets.

Example:
  MOM      15% book · ~1–6 trades/day  · target +1% net
  MR       15%      · ~2–8/day
  MICRO_ARB 20%     · up to 40/day (block-time, gas-gated)
  YIELD    25%      · continuous / weekly claims (not +1% trade)
  WEEKLY   10%      · 1 trade/week (swing)
  RESERVE  15%      · idle / DEFENSE

Each sleeve tracks its own compound equity and trade count.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from lia.defi.ashswap_fees import edge_after_fees
from lia.gas.micro_trade import should_skip_micro_trade

_ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = _ROOT / "data" / "lia_compound_pyramids.json"


@dataclass
class SleeveSpec:
    id: str
    weight: float  # fraction of deployable book
    target_net_pct: float  # e.g. 0.01
    max_trades_per_day: int
    max_trades_per_week: int
    min_hours_between: float
    compounds_goal: int  # contribution toward global 1000
    kind: str  # trade | yield | reserve


DEFAULT_PYRAMID: list[SleeveSpec] = [
    SleeveSpec("MOM", 0.15, 0.01, 6, 30, 2.0, 200, "trade"),
    SleeveSpec("MR", 0.15, 0.01, 8, 40, 1.0, 200, "trade"),
    SleeveSpec("MICRO_ARB", 0.20, 0.004, 40, 200, 0.1, 300, "trade"),  # smaller edge, more freq
    SleeveSpec("WEEKLY_SWING", 0.10, 0.02, 1, 1, 24.0 * 5, 50, "trade"),
    SleeveSpec("YIELD", 0.25, 0.0, 5, 20, 1.0, 100, "yield"),
    SleeveSpec("RESERVE", 0.15, 0.0, 0, 0, 0.0, 0, "reserve"),
]


@dataclass
class SleeveState:
    id: str
    equity_usd: float = 0.0
    compounds_done: int = 0
    trades_today: int = 0
    trades_week: int = 0
    last_trade_ts: float = 0.0
    day_key: str = ""
    week_key: str = ""
    wins: int = 0
    losses: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _day_key(ts: float) -> str:
    return time.strftime("%Y-%m-%d", time.gmtime(ts))


def _week_key(ts: float) -> str:
    return time.strftime("%Y-W%W", time.gmtime(ts))


class CompoundPyramids:
    def __init__(
        self,
        total_book_usd: float = 100.0,
        specs: Optional[list[SleeveSpec]] = None,
        state_path: Optional[Path] = None,
    ):
        self.specs = {s.id: s for s in (specs or DEFAULT_PYRAMID)}
        self.total_book_usd = total_book_usd
        self.state_path = Path(state_path or STATE_PATH)
        self.sleeves: dict[str, SleeveState] = {}
        self._init_or_load()

    def _init_or_load(self) -> None:
        if self.state_path.exists():
            try:
                raw = json.loads(self.state_path.read_text(encoding="utf-8"))
                self.total_book_usd = float(raw.get("total_book_usd") or self.total_book_usd)
                for sid, st in (raw.get("sleeves") or {}).items():
                    self.sleeves[sid] = SleeveState(**{k: v for k, v in st.items() if k in SleeveState.__dataclass_fields__})
                return
            except Exception:
                pass
        for sid, spec in self.specs.items():
            self.sleeves[sid] = SleeveState(id=sid, equity_usd=round(self.total_book_usd * spec.weight, 4))

    def save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_book_usd": self.total_book_usd,
            "global_compounds": sum(s.compounds_done for s in self.sleeves.values()),
            "goal_compounds": sum(s.compounds_goal for s in self.specs.values()),
            "sleeves": {k: v.to_dict() for k, v in self.sleeves.items()},
            "specs": {k: asdict(v) for k, v in self.specs.items()},
        }
        self.state_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def _roll_counters(self, st: SleeveState, now: float) -> None:
        dk, wk = _day_key(now), _week_key(now)
        if st.day_key != dk:
            st.day_key = dk
            st.trades_today = 0
        if st.week_key != wk:
            st.week_key = wk
            st.trades_week = 0

    def can_trade(self, sleeve_id: str, now: Optional[float] = None) -> dict[str, Any]:
        now = time.time() if now is None else now
        spec = self.specs.get(sleeve_id)
        st = self.sleeves.get(sleeve_id)
        if not spec or not st:
            return {"ok": False, "reason": "unknown sleeve"}
        if spec.kind == "reserve":
            return {"ok": False, "reason": "reserve"}
        self._roll_counters(st, now)
        if spec.max_trades_per_day and st.trades_today >= spec.max_trades_per_day:
            return {"ok": False, "reason": "day cap", "trades_today": st.trades_today}
        if spec.max_trades_per_week and st.trades_week >= spec.max_trades_per_week:
            return {"ok": False, "reason": "week cap"}
        if st.last_trade_ts and spec.min_hours_between:
            hours = (now - st.last_trade_ts) / 3600.0
            if hours < spec.min_hours_between:
                return {"ok": False, "reason": f"pace {hours:.2f}h < {spec.min_hours_between}h"}
        return {
            "ok": True,
            "equity_usd": st.equity_usd,
            "target_net_pct": spec.target_net_pct,
            "trades_today": st.trades_today,
            "max_day": spec.max_trades_per_day,
        }

    def precheck_edge(
        self,
        sleeve_id: str,
        gross_edge_pct: float,
        notional_usd: float,
        protocol: str = "ashswap",
    ) -> dict[str, Any]:
        spec = self.specs.get(sleeve_id)
        if not spec:
            return {"ok": False, "reason": "unknown"}
        fee = edge_after_fees(gross_edge_pct, notional_usd, protocol)
        gas = should_skip_micro_trade(
            notional_usd=notional_usd,
            expected_edge_usd=max(0.0, fee["net_edge_pct"] * notional_usd),
        )
        need = spec.target_net_pct if spec.target_net_pct > 0 else 0.002
        ok = fee["ok"] and fee["net_edge_pct"] + 1e-9 >= need * 0.5 and not gas["skip"]
        return {"ok": ok, "fee": fee, "gas": gas, "need_net_pct": need}

    def record_outcome(
        self,
        sleeve_id: str,
        *,
        net_pct: float,
        notional_usd: float,
        win: bool,
        now: Optional[float] = None,
    ) -> dict[str, Any]:
        now = time.time() if now is None else now
        st = self.sleeves[sleeve_id]
        spec = self.specs[sleeve_id]
        self._roll_counters(st, now)
        st.trades_today += 1
        st.trades_week += 1
        st.last_trade_ts = now
        pnl = notional_usd * net_pct
        st.equity_usd = max(0.0, st.equity_usd + pnl)
        if win and net_pct >= spec.target_net_pct * 0.9:
            st.compounds_done += 1
            st.wins += 1
        elif not win:
            st.losses += 1
        self.save()
        return st.to_dict()

    def progress(self) -> dict[str, Any]:
        goal = sum(s.compounds_goal for s in self.specs.values())
        done = sum(s.compounds_done for s in self.sleeves.values())
        return {
            "compounds_done": done,
            "compounds_goal": goal,
            "pct": round(100.0 * done / goal, 2) if goal else 0,
            "projected_mult_if_all_1pct": round((1.01) ** done, 4) if done else 1.0,
            "sleeves": {k: v.to_dict() for k, v in self.sleeves.items()},
            "note": "1000×1% is asymptotic goal; live requires MICRO_PROOF",
        }

    def rebalance_weights(self, total_book_usd: Optional[float] = None) -> None:
        """Reset sleeve equity to target weights (paper ops)."""
        if total_book_usd is not None:
            self.total_book_usd = total_book_usd
        for sid, spec in self.specs.items():
            st = self.sleeves.setdefault(sid, SleeveState(id=sid))
            st.equity_usd = round(self.total_book_usd * spec.weight, 4)
        self.save()


if __name__ == "__main__":
    p = CompoundPyramids(100.0)
    print(json.dumps(p.progress(), indent=2))
    print("MICRO_ARB can", p.can_trade("MICRO_ARB"))
    print("WEEKLY can", p.can_trade("WEEKLY_SWING"))
    print("edge", p.precheck_edge("MICRO_ARB", 0.015, 15, "ashswap"))
