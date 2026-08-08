"""
Secure take-profit stack — Guardian-first profit realization.
============================================================
Combines:
  - TpPlan (fixed | log | exp | ladder) scale-out
  - Dynamic trailing stop (HWM / break-even / step tighten)
  - Fee-aware min edge (skip micro TP if net ≤ 0 after fees+gas)
  - Profit lock: realized net not re-risked beyond lock_ratio
  - Leverage / spiral veto via guardian_gate

Default: paper-safe. Live only when LIA_LIVE_TRADING=1 AND gates pass.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Optional

from lia.circuit.take_profit_curves import TpPlan, build_tp_plan, validate_plan
from lia.circuit.tp_mode import make_plan, tick_plan
from lia.guardian.spiral import PolicyLimits, guardian_gate
from lia.risk.trailing_stop import DynamicPosition, Side, TrailMode


def live_trading_enabled() -> bool:
    return os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE", "yes")


@dataclass
class SecureTpConfig:
    tp_mode: str = "log"
    fee_roundtrip: float = 0.006  # DEX + gas approx MVX
    min_net_edge: float = 0.0015  # skip partial if net < 15 bps
    lock_ratio: float = 0.70  # 70% of realized net locked (not re-compounded)
    trail_pct: float = 0.06
    be_trigger_pct: float = 0.012
    atr_mult: float = 2.0
    trail_mode: str = "hybrid"
    gross_for_fixed: float = 0.02


@dataclass
class SecurePosition:
    id: str
    chain: str  # multiversx | solana | hyperliquid
    venue: str
    token: str
    side: str = "LONG"
    entry: float = 0.0
    size_usd: float = 0.0
    equity_usd: float = 0.0
    notional_usd: float = 0.0
    tp_plan: dict[str, Any] = field(default_factory=dict)
    trail: Optional[DynamicPosition] = None
    realized_gross: float = 0.0
    realized_net: float = 0.0
    locked_usd: float = 0.0
    compoundable_usd: float = 0.0
    status: str = "OPEN"
    opened_at: float = field(default_factory=time.time)
    cfg: SecureTpConfig = field(default_factory=SecureTpConfig)

    def leverage(self) -> float:
        eq = max(self.equity_usd, 1e-9)
        return max(self.notional_usd, self.size_usd) / eq


class SecureTakeProfitEngine:
    """Orchestrates TP + trail + guardian for open positions."""

    def __init__(self, policy: Optional[PolicyLimits] = None):
        self.policy = policy or PolicyLimits()
        self.positions: dict[str, SecurePosition] = {}

    def open(
        self,
        *,
        id: str,
        chain: str,
        venue: str,
        token: str,
        entry: float,
        size_usd: float,
        equity_usd: float,
        side: str = "LONG",
        notional_usd: Optional[float] = None,
        atr: float = 0.0,
        cfg: Optional[SecureTpConfig] = None,
        compound_intensity: float = 0.5,
        ret_roe: float = 0.0,
        drawdown: float = 0.0,
        consecutive_wins: int = 0,
        mode: str = "COMPOUND",
    ) -> dict[str, Any]:
        cfg = cfg or SecureTpConfig()
        notional = notional_usd if notional_usd is not None else size_usd

        # Chain leverage hard rules before open
        chain_gate = self._chain_leverage_gate(chain, notional / max(equity_usd, 1e-9))
        if not chain_gate["allow"]:
            return {"ok": False, "reason": chain_gate["reason"], "gate": chain_gate}

        g = guardian_gate(
            equity=equity_usd,
            notional=notional,
            ret_roe=ret_roe,
            drawdown=drawdown,
            compound_intensity=compound_intensity,
            consecutive_wins=consecutive_wins,
            mode=mode,
            policy=self.policy,
        )
        if not g.allow:
            return {
                "ok": False,
                "reason": g.reason,
                "guardian": g.__dict__,
            }

        plan_wrap = make_plan(entry, cfg.gross_for_fixed, cfg.tp_mode)
        if not plan_wrap["validation"].get("ok"):
            plan_wrap = make_plan(entry, cfg.gross_for_fixed, "fixed")

        trail = DynamicPosition(
            id=id,
            token=token,
            side=Side(side),
            entry=entry,
            size_usd=size_usd,
            atr=atr,
            trail_pct=cfg.trail_pct,
            atr_mult=cfg.atr_mult,
            trail_mode=TrailMode(cfg.trail_mode),
            be_trigger_pct=cfg.be_trigger_pct,
        )

        pos = SecurePosition(
            id=id,
            chain=chain,
            venue=venue,
            token=token,
            side=side,
            entry=entry,
            size_usd=size_usd,
            equity_usd=equity_usd,
            notional_usd=min(notional, g.max_notional or notional),
            tp_plan=plan_wrap["plan"],
            trail=trail,
            cfg=cfg,
        )
        self.positions[id] = pos
        return {
            "ok": True,
            "id": id,
            "tp_mode": plan_wrap["mode"],
            "plan": plan_wrap["plan"],
            "guardian": g.__dict__,
            "live": live_trading_enabled(),
            "execution": "LIVE" if live_trading_enabled() else "PAPER",
        }

    def on_tick(
        self,
        id: str,
        price: float,
        *,
        atr: Optional[float] = None,
        equity_usd: Optional[float] = None,
        drawdown: float = 0.0,
        compound_intensity: float = 0.5,
    ) -> dict[str, Any]:
        pos = self.positions.get(id)
        if not pos or pos.status != "OPEN":
            return {"action": "NONE", "error": "unknown_or_closed"}

        if equity_usd is not None:
            pos.equity_usd = equity_usd

        # 1) Trailing / stop / partial by R
        if atr is not None and pos.trail:
            pos.trail.update_atr(atr)
        trail_res = pos.trail.on_tick(price) if pos.trail else {"action": "NONE"}

        # 2) Curve TP levels
        tp_res = tick_plan(pos.tp_plan, price)
        pos.tp_plan = tp_res["plan"]

        actions: list[str] = []
        partials: list[dict[str, Any]] = []

        # Process curve partials with fee filter
        for lv in tp_res.get("newly_hit", []):
            gross = float(lv["gross_pct"])
            frac = float(lv["size_frac"])
            net = gross - pos.cfg.fee_roundtrip
            if net < pos.cfg.min_net_edge:
                actions.append("SKIP_TP_FEE")
                continue
            usd = pos.size_usd * frac * max(0.0, net)
            locked = usd * pos.cfg.lock_ratio
            compoundable = usd - locked
            pos.realized_gross += pos.size_usd * frac * gross
            pos.realized_net += usd
            pos.locked_usd += locked
            pos.compoundable_usd += compoundable
            partials.append(
                {
                    "source": "tp_curve",
                    "level": lv["index"],
                    "gross": gross,
                    "net": net,
                    "frac": frac,
                    "locked_usd": locked,
                    "compoundable_usd": compoundable,
                }
            )
            actions.append("PARTIAL_TP")

        # Trail STOP closes remainder
        if trail_res.get("action") == "STOP":
            rem = max(0.0, 1.0 - float(pos.tp_plan.get("realized_frac", 0.0)))
            if rem > 0 and pos.entry > 0:
                if pos.side == "LONG":
                    gross = (price - pos.entry) / pos.entry
                else:
                    gross = (pos.entry - price) / pos.entry
                net = gross - pos.cfg.fee_roundtrip
                usd = pos.size_usd * rem * net
                if usd > 0:
                    locked = usd * pos.cfg.lock_ratio
                    pos.realized_net += usd
                    pos.locked_usd += locked
                    pos.compoundable_usd += usd - locked
            pos.status = "STOPPED"
            actions.append("STOP")

        # Guardian may force reduce compoundable (spiral)
        g = guardian_gate(
            equity=pos.equity_usd,
            notional=pos.notional_usd,
            ret_roe=pos.realized_net / max(pos.equity_usd, 1e-9),
            drawdown=drawdown,
            compound_intensity=compound_intensity,
            mode="COMPOUND",
            policy=self.policy,
        )
        if not g.allow and pos.compoundable_usd > 0:
            # Move remaining compoundable into lock under stress
            pos.locked_usd += pos.compoundable_usd
            pos.compoundable_usd = 0.0
            actions.append("LOCKDOWN_" + g.reason)

        if tp_res.get("all_levels_done") and trail_res.get("action") != "STOP":
            # runner managed only by trail
            actions.append("RUNNER_ONLY")

        return {
            "id": id,
            "price": price,
            "actions": actions or ["NONE"],
            "trail": trail_res,
            "tp": {k: tp_res[k] for k in ("action", "realized_frac", "all_levels_done") if k in tp_res},
            "partials": partials,
            "realized_net": pos.realized_net,
            "locked_usd": pos.locked_usd,
            "compoundable_usd": pos.compoundable_usd,
            "status": pos.status,
            "guardian_ok": g.allow,
            "execution": "LIVE" if live_trading_enabled() else "PAPER",
        }

    def _chain_leverage_gate(self, chain: str, lev: float) -> dict[str, Any]:
        c = (chain or "").lower()
        live = live_trading_enabled()
        if c in ("solana", "hyperliquid"):
            if live and lev > self.policy.sol_live_lev_max:
                return {"allow": False, "reason": f"{c}_live_lev_cap", "lev": lev}
            if live and lev > 1.0:
                return {"allow": False, "reason": f"{c}_live_spot_only_micro", "lev": lev}
            return {"allow": True, "reason": "ok_signals_or_paper", "lev": lev}
        # MultiversX: no leveraged perps; hatom loop handled separately
        if lev > self.policy.L_max:
            return {"allow": False, "reason": "mvx_leverage_cap", "lev": lev}
        return {"allow": True, "reason": "ok", "lev": lev}

    def snapshot(self) -> list[dict[str, Any]]:
        out = []
        for p in self.positions.values():
            out.append(
                {
                    "id": p.id,
                    "chain": p.chain,
                    "venue": p.venue,
                    "token": p.token,
                    "status": p.status,
                    "entry": p.entry,
                    "size_usd": p.size_usd,
                    "realized_net": p.realized_net,
                    "locked_usd": p.locked_usd,
                    "compoundable_usd": p.compoundable_usd,
                    "tp_mode": p.tp_plan.get("mode"),
                    "realized_frac": p.tp_plan.get("realized_frac"),
                }
            )
        return out


def should_skip_micro_trade(
    *,
    expected_gross: float,
    fee_roundtrip: float = 0.006,
    gas_usd: float = 0.02,
    size_usd: float = 10.0,
    min_net_edge: float = 0.0015,
) -> tuple[bool, str]:
    """Skip dust trades where fees+gas dominate."""
    net = expected_gross - fee_roundtrip - (gas_usd / max(size_usd, 1e-9))
    if net < min_net_edge:
        return True, f"net_edge_{net:.5f}<{min_net_edge}"
    return False, "ok"
