"""
LIA Circuit Guards — garde-fous optimisés (risk management compétent)
=====================================================================
Aucun trade ne passe sans `preflight_ok`.
Aucun hold TRO. SL toujours armé.

Garde-fous:
  G01  HALT (manual or consecutive losses)
  G02  COOLDOWN temporelle
  G03  POSITION déjà ouverte (max 1)
  G04  GOAL trades atteint
  G05  Cadence / pace
  G06  Daily trade count cap
  G07  Asset policy (token autorisé accumulation)
  G08  Notional min/max + risk budget dynamique
  G09  Profit validated (gross >= fees + target net)
  G10  Liquidity pair minimum
  G11  GreenSmoke RISK_OFF → no BUY
  G12  Hatom HF critique
  G13  Pre-verify on-chain
  G14  Runtime SL / BE / trailing
  G15  Post-verify tx status
  G16  Drawdown circuit (hard)
  G17  Multi-horizon veto flag
  G18  Volatility filter (ATR / range trop large)
  G19  Time-stop (max hold duration)
  G20  Soft drawdown warning (réduit le risk)
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional

ACCUMULATE_PREFIXES = ("EGLD", "WEGLD", "USDC", "WBTC", "HWBTC", "BTC")
BLOCKED_HOLD = ("TRO", "TRO-94C925", "TUDURIORIGINAL")


class GuardCode(str, Enum):
    G01_HALT = "G01_HALT"
    G02_COOLDOWN = "G02_COOLDOWN"
    G03_POSITION_OPEN = "G03_POSITION_OPEN"
    G04_GOAL = "G04_GOAL"
    G05_PACE = "G05_PACE"
    G06_DAILY_CAP = "G06_DAILY_CAP"
    G07_ASSET = "G07_ASSET"
    G08_NOTIONAL = "G08_NOTIONAL"
    G09_PROFIT = "G09_PROFIT"
    G10_LIQUIDITY = "G10_LIQUIDITY"
    G11_REGIME = "G11_REGIME"
    G12_HF = "G12_HF"
    G13_PRE_CHAIN = "G13_PRE_CHAIN"
    G14_RUNTIME = "G14_RUNTIME"
    G15_POST_CHAIN = "G15_POST_CHAIN"
    G16_DRAWDOWN = "G16_DRAWDOWN"
    G17_HORIZON_VETO = "G17_HORIZON_VETO"
    G18_VOLATILITY = "G18_VOLATILITY"
    G19_TIME_STOP = "G19_TIME_STOP"
    G20_SOFT_DD = "G20_SOFT_DD"


@dataclass
class GuardResult:
    ok: bool
    code: str
    message: str
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class GuardConfig:
    """Calibrage risk management compétent — aligné CompoundCircuit optimisé."""
    # Pace & frequency
    min_hours_between_trades: float = 0.33   # ~20 min
    max_trades_per_day: int = 6              # qualité > quantité

    # Sizing
    min_notional_usd: float = 5.0
    max_notional_usd: float = 350.0
    max_pct_deployable: float = 0.20         # jamais > 20 %
    risk_per_trade_pct: float = 0.015        # 1.5 % equity at risk
    risk_scale_min: float = 0.50             # floor after soft DD / low conf
    risk_scale_max: float = 1.20             # ceiling on high conf + streak

    # Stops / targets (short-horizon +1% net)
    stop_loss_pct: float = 0.009
    target_net_pct: float = 0.01
    be_trigger_pct: float = 0.004
    trail_after_pct: float = 0.006
    trail_pct: float = 0.0035

    # Market quality
    min_liquidity_usd: float = 60_000.0
    min_egld_gas: float = 0.02
    min_hatom_hf: float = 1.8
    max_atr_pct: float = 0.04               # bloquer si ATR 1h > 4 % du prix
    max_hold_seconds: float = 4 * 3600      # time-stop 4 h

    # Drawdown
    max_drawdown_pct: float = 0.12           # hard halt 12 %
    soft_drawdown_pct: float = 0.06          # réduit le risk dès 6 %
    max_consecutive_losses: int = 2

    # Fees (réalistes MultiversX DEX)
    dex_fee_rt: float = 0.006
    gas_usd: float = 0.04
    max_slippage: float = 0.0025
    safety_buffer: float = 0.0015


@dataclass
class DailyCounter:
    day: str = ""
    trades: int = 0

    def bump(self) -> int:
        today = time.strftime("%Y-%m-%d", time.gmtime())
        if self.day != today:
            self.day = today
            self.trades = 0
        self.trades += 1
        return self.trades

    def count_today(self) -> int:
        today = time.strftime("%Y-%m-%d", time.gmtime())
        if self.day != today:
            return 0
        return self.trades


class CircuitGuards:
    """Central guard rail for LIA circuit — optimized risk."""

    def __init__(
        self,
        config: Optional[GuardConfig] = None,
        state_path: str = "data/lia_guards_state.json",
    ):
        self.cfg = config or GuardConfig()
        self.state_path = Path(state_path)
        self.daily = DailyCounter()
        self.blocked_until: float = 0.0
        self.manual_halt: bool = False
        self.manual_halt_reason: str = ""
        self._load()

    def _load(self) -> None:
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self.daily = DailyCounter(
                day=str(raw.get("day", "")),
                trades=int(raw.get("trades", 0)),
            )
            self.blocked_until = float(raw.get("blocked_until", 0))
            self.manual_halt = bool(raw.get("manual_halt", False))
            self.manual_halt_reason = str(raw.get("manual_halt_reason", ""))
        except Exception:
            pass

    def save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(
            json.dumps(
                {
                    "day": self.daily.day,
                    "trades": self.daily.trades,
                    "blocked_until": self.blocked_until,
                    "manual_halt": self.manual_halt,
                    "manual_halt_reason": self.manual_halt_reason,
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def set_halt(self, reason: str) -> None:
        self.manual_halt = True
        self.manual_halt_reason = reason
        self.save()

    def clear_halt(self) -> None:
        self.manual_halt = False
        self.manual_halt_reason = ""
        self.save()

    # ----- dynamic risk scaling -----

    def risk_scale(
        self,
        *,
        confidence: float = 0.7,
        consecutive_wins: int = 0,
        consecutive_losses: int = 0,
        equity_usd: float = 0.0,
        peak_usd: float = 0.0,
        gs_regime: str = "NEUTRAL",
        strategy: str = "",
    ) -> float:
        """
        Multiplier appliqué au risk_per_trade_pct.
        < 1 en soft DD / low conf / post-loss ; > 1 si high conf + streak.
        """
        scale = 1.0

        # Soft drawdown → reduce
        if peak_usd > 0 and equity_usd > 0:
            dd = (peak_usd - equity_usd) / peak_usd
            if dd >= self.cfg.soft_drawdown_pct:
                # linear taper from 1.0 at soft_dd to risk_scale_min at hard_dd
                span = max(self.cfg.max_drawdown_pct - self.cfg.soft_drawdown_pct, 1e-6)
                t = min(1.0, (dd - self.cfg.soft_drawdown_pct) / span)
                scale *= 1.0 - t * (1.0 - self.cfg.risk_scale_min)

        # Confidence
        if confidence < 0.60:
            scale *= 0.70
        elif confidence >= 0.85:
            scale *= 1.10
        elif confidence >= 0.75:
            scale *= 1.05

        # Streak
        if consecutive_losses >= 1:
            scale *= 0.75
        if consecutive_wins >= 3:
            scale *= 1.08
        elif consecutive_wins >= 5:
            scale *= 1.12

        # Regime
        regime = str(gs_regime).upper()
        if regime == "RISK_OFF":
            scale *= 0.0  # will be blocked anyway by G11
        elif regime == "RISK_ON" and strategy == "STATARB":
            scale *= 1.05

        return max(self.cfg.risk_scale_min, min(self.cfg.risk_scale_max, scale))

    # ----- individual checks -----

    def check_halt(self, consecutive_losses: int = 0, halted_flag: bool = False, halt_reason: str = "") -> GuardResult:
        if self.manual_halt:
            return GuardResult(False, GuardCode.G01_HALT.value, f"manual halt: {self.manual_halt_reason}")
        if halted_flag:
            return GuardResult(False, GuardCode.G01_HALT.value, f"circuit halt: {halt_reason}")
        if consecutive_losses >= self.cfg.max_consecutive_losses:
            return GuardResult(
                False,
                GuardCode.G01_HALT.value,
                f"{consecutive_losses} consecutive losses >= {self.cfg.max_consecutive_losses}",
            )
        return GuardResult(True, GuardCode.G01_HALT.value, "ok")

    def check_cooldown(self, cooldown_until: float) -> GuardResult:
        now = time.time()
        until = max(cooldown_until, self.blocked_until)
        if now < until:
            return GuardResult(
                False,
                GuardCode.G02_COOLDOWN.value,
                f"cooldown {until - now:.0f}s remaining",
                {"until": until},
            )
        return GuardResult(True, GuardCode.G02_COOLDOWN.value, "ok")

    def check_position(self, has_open: bool) -> GuardResult:
        if has_open:
            return GuardResult(False, GuardCode.G03_POSITION_OPEN.value, "position already open")
        return GuardResult(True, GuardCode.G03_POSITION_OPEN.value, "ok")

    def check_goal(self, total_closed: int, goal: int = 1000) -> GuardResult:
        if total_closed >= goal:
            return GuardResult(False, GuardCode.G04_GOAL.value, f"goal {goal} reached")
        return GuardResult(True, GuardCode.G04_GOAL.value, "ok")

    def check_pace(self, hours_since_last_swap: float) -> GuardResult:
        if hours_since_last_swap < self.cfg.min_hours_between_trades:
            return GuardResult(
                False,
                GuardCode.G05_PACE.value,
                f"pace: {hours_since_last_swap:.2f}h < {self.cfg.min_hours_between_trades}h",
            )
        return GuardResult(True, GuardCode.G05_PACE.value, "ok")

    def check_daily_cap(self) -> GuardResult:
        n = self.daily.count_today()
        if n >= self.cfg.max_trades_per_day:
            return GuardResult(
                False,
                GuardCode.G06_DAILY_CAP.value,
                f"daily cap {n}/{self.cfg.max_trades_per_day}",
            )
        return GuardResult(True, GuardCode.G06_DAILY_CAP.value, f"{n}/{self.cfg.max_trades_per_day}")

    def check_asset(self, token: str) -> GuardResult:
        t = (token or "").upper()
        for blocked in BLOCKED_HOLD:
            if blocked in t:
                return GuardResult(
                    False,
                    GuardCode.G07_ASSET.value,
                    f"TRO/blocked token cannot be circuit target: {token}",
                )
        ok = any(t.startswith(p) or p in t for p in ACCUMULATE_PREFIXES)
        if not ok:
            return GuardResult(
                False,
                GuardCode.G07_ASSET.value,
                f"token not in accumulate set: {token}",
            )
        return GuardResult(True, GuardCode.G07_ASSET.value, "ok")

    def check_notional(
        self,
        deployable_usd: float,
        proposed_notional: Optional[float] = None,
        risk_mult: float = 1.0,
    ) -> GuardResult:
        if deployable_usd < self.cfg.min_notional_usd:
            return GuardResult(
                False,
                GuardCode.G08_NOTIONAL.value,
                f"deployable ${deployable_usd:.2f} < min ${self.cfg.min_notional_usd}",
            )
        effective_risk = self.cfg.risk_per_trade_pct * max(self.cfg.risk_scale_min, min(self.cfg.risk_scale_max, risk_mult))
        risk_budget = deployable_usd * effective_risk
        notional = risk_budget / max(self.cfg.stop_loss_pct, 0.001)
        notional = max(self.cfg.min_notional_usd, min(self.cfg.max_notional_usd, notional))
        notional = min(notional, deployable_usd * self.cfg.max_pct_deployable)
        if proposed_notional is not None and proposed_notional > notional * 1.01:
            return GuardResult(
                False,
                GuardCode.G08_NOTIONAL.value,
                f"proposed ${proposed_notional:.2f} > allowed ${notional:.2f}",
                {"max_notional": notional, "risk_mult": risk_mult},
            )
        return GuardResult(
            True,
            GuardCode.G08_NOTIONAL.value,
            "ok",
            {"max_notional": round(notional, 4), "risk_mult": round(risk_mult, 3), "effective_risk_pct": round(effective_risk, 5)},
        )

    def check_profit_validated(self, notional_usd: float, expected_gross_pct: Optional[float] = None) -> GuardResult:
        gas_pct = self.cfg.gas_usd / max(notional_usd, 0.01)
        req = self.cfg.dex_fee_rt + gas_pct + self.cfg.max_slippage + self.cfg.safety_buffer + self.cfg.target_net_pct
        if expected_gross_pct is not None and expected_gross_pct < req:
            return GuardResult(
                False,
                GuardCode.G09_PROFIT.value,
                f"expected gross {expected_gross_pct:.4f} < required {req:.4f}",
                {"required_gross_pct": req},
            )
        return GuardResult(True, GuardCode.G09_PROFIT.value, "ok", {"required_gross_pct": round(req, 6)})

    def check_liquidity(self, liquidity_usd: float) -> GuardResult:
        if liquidity_usd < self.cfg.min_liquidity_usd:
            return GuardResult(
                False,
                GuardCode.G10_LIQUIDITY.value,
                f"liquidity ${liquidity_usd:.0f} < ${self.cfg.min_liquidity_usd:.0f}",
            )
        return GuardResult(True, GuardCode.G10_LIQUIDITY.value, "ok")

    def check_regime(self, gs_regime: str, intent: str = "BUY") -> GuardResult:
        if intent.upper() == "BUY" and str(gs_regime).upper() == "RISK_OFF":
            return GuardResult(False, GuardCode.G11_REGIME.value, "RISK_OFF blocks BUY")
        return GuardResult(True, GuardCode.G11_REGIME.value, "ok")

    def check_hf(self, hatom_hf: float) -> GuardResult:
        if hatom_hf < self.cfg.min_hatom_hf:
            return GuardResult(
                False,
                GuardCode.G12_HF.value,
                f"Hatom HF {hatom_hf:.2f} < {self.cfg.min_hatom_hf}",
            )
        return GuardResult(True, GuardCode.G12_HF.value, "ok")

    def check_drawdown(self, equity_usd: float, peak_usd: float) -> GuardResult:
        if peak_usd <= 0:
            return GuardResult(True, GuardCode.G16_DRAWDOWN.value, "ok")
        dd = (peak_usd - equity_usd) / peak_usd
        if dd >= self.cfg.max_drawdown_pct:
            return GuardResult(
                False,
                GuardCode.G16_DRAWDOWN.value,
                f"drawdown {dd:.1%} >= max {self.cfg.max_drawdown_pct:.0%}",
                {"drawdown_pct": dd},
            )
        return GuardResult(True, GuardCode.G16_DRAWDOWN.value, "ok", {"drawdown_pct": round(dd, 4)})

    def check_horizon_veto(self, veto: bool, reason: str = "") -> GuardResult:
        if veto:
            return GuardResult(False, GuardCode.G17_HORIZON_VETO.value, reason or "multi-horizon veto")
        return GuardResult(True, GuardCode.G17_HORIZON_VETO.value, "ok")

    def check_volatility(self, atr_pct: Optional[float] = None) -> GuardResult:
        """G18 — bloquer si volatilité trop élevée pour un TP +1% net."""
        if atr_pct is None:
            return GuardResult(True, GuardCode.G18_VOLATILITY.value, "ok (no atr)")
        if atr_pct > self.cfg.max_atr_pct:
            return GuardResult(
                False,
                GuardCode.G18_VOLATILITY.value,
                f"ATR {atr_pct:.2%} > max {self.cfg.max_atr_pct:.0%}",
                {"atr_pct": atr_pct},
            )
        return GuardResult(True, GuardCode.G18_VOLATILITY.value, "ok", {"atr_pct": atr_pct})

    def check_time_stop(self, opened_at: float, now: Optional[float] = None) -> GuardResult:
        """G19 — force exit si hold trop long (edge +1% expiré)."""
        now = now if now is not None else time.time()
        held = now - opened_at
        if held >= self.cfg.max_hold_seconds:
            return GuardResult(
                False,
                GuardCode.G19_TIME_STOP.value,
                f"time-stop: held {held/3600:.1f}h >= {self.cfg.max_hold_seconds/3600:.0f}h",
                {"held_sec": held},
            )
        return GuardResult(True, GuardCode.G19_TIME_STOP.value, "ok", {"held_sec": held})

    def check_soft_drawdown(self, equity_usd: float, peak_usd: float) -> GuardResult:
        """G20 — warning only: always ok, but meta carries scale hint."""
        if peak_usd <= 0:
            return GuardResult(True, GuardCode.G20_SOFT_DD.value, "ok", {"soft": False, "suggested_scale": 1.0})
        dd = (peak_usd - equity_usd) / peak_usd
        soft = dd >= self.cfg.soft_drawdown_pct
        scale = 1.0
        if soft:
            span = max(self.cfg.max_drawdown_pct - self.cfg.soft_drawdown_pct, 1e-6)
            t = min(1.0, (dd - self.cfg.soft_drawdown_pct) / span)
            scale = 1.0 - t * (1.0 - self.cfg.risk_scale_min)
        return GuardResult(
            True,
            GuardCode.G20_SOFT_DD.value,
            "soft DD active" if soft else "ok",
            {"soft": soft, "drawdown_pct": round(dd, 4), "suggested_scale": round(scale, 3)},
        )

    def arm_stops(self, entry: float, notional_usd: float) -> dict[str, float]:
        gas_pct = self.cfg.gas_usd / max(notional_usd, 0.01)
        gross = (
            self.cfg.dex_fee_rt
            + gas_pct
            + self.cfg.max_slippage
            + self.cfg.safety_buffer
            + self.cfg.target_net_pct
        )
        return {
            "stop": entry * (1 - self.cfg.stop_loss_pct),
            "target": entry * (1 + gross),
            "be_trigger": entry * (1 + self.cfg.be_trigger_pct),
            "trail_activate": entry * (1 + self.cfg.trail_after_pct),
            "trail_pct": self.cfg.trail_pct,
            "gross_required_pct": gross,
            "max_hold_seconds": self.cfg.max_hold_seconds,
        }

    def runtime_action(
        self,
        *,
        entry: float,
        price: float,
        stop: float,
        target: float,
        hwm: float,
        trail_active: bool,
        opened_at: Optional[float] = None,
    ) -> dict[str, Any]:
        """G14 + G19 runtime."""
        new_hwm = max(hwm, price)
        new_stop = stop
        new_trail = trail_active

        if price >= entry * (1 + self.cfg.be_trigger_pct):
            new_stop = max(new_stop, entry)
        if price >= entry * (1 + self.cfg.trail_after_pct):
            new_trail = True
        if new_trail:
            trail_stop = new_hwm * (1 - self.cfg.trail_pct)
            new_stop = max(new_stop, trail_stop)

        action = "HOLD"
        if price <= new_stop:
            action = "STOP_LOSS"
        elif price >= target:
            action = "TAKE_PROFIT"
        elif opened_at is not None:
            ts = self.check_time_stop(opened_at)
            if not ts.ok:
                action = "TIME_STOP"

        return {
            "action": action,
            "stop": new_stop,
            "hwm": new_hwm,
            "trail_active": new_trail,
            "code": GuardCode.G14_RUNTIME.value,
        }

    def preflight(
        self,
        *,
        token: str,
        deployable_usd: float,
        liquidity_usd: float = 1e12,
        gs_regime: str = "NEUTRAL",
        hatom_hf: float = 999.0,
        hours_since_swap: float = 999.0,
        has_open_position: bool = False,
        consecutive_losses: int = 0,
        consecutive_wins: int = 0,
        halted_flag: bool = False,
        halt_reason: str = "",
        cooldown_until: float = 0.0,
        total_closed_trades: int = 0,
        goal_trades: int = 1000,
        equity_usd: float = 0.0,
        peak_usd: float = 0.0,
        horizon_veto: bool = False,
        horizon_veto_reason: str = "",
        intent: str = "BUY",
        profit_validated: bool = True,
        expected_gross_pct: Optional[float] = None,
        proposed_notional: Optional[float] = None,
        pre_chain_ok: bool = True,
        pre_chain_detail: str = "skipped",
        atr_pct: Optional[float] = None,
        confidence: float = 0.7,
        strategy: str = "",
    ) -> dict[str, Any]:
        scale = self.risk_scale(
            confidence=confidence,
            consecutive_wins=consecutive_wins,
            consecutive_losses=consecutive_losses,
            equity_usd=equity_usd,
            peak_usd=peak_usd,
            gs_regime=gs_regime,
            strategy=strategy,
        )

        checks: list[GuardResult] = [
            self.check_halt(consecutive_losses, halted_flag, halt_reason),
            self.check_cooldown(cooldown_until),
            self.check_position(has_open_position),
            self.check_goal(total_closed_trades, goal_trades),
            self.check_pace(hours_since_swap),
            self.check_daily_cap(),
            self.check_asset(token),
            self.check_notional(deployable_usd, proposed_notional, risk_mult=scale),
            self.check_liquidity(liquidity_usd),
            self.check_regime(gs_regime, intent),
            self.check_hf(hatom_hf),
            self.check_drawdown(equity_usd if equity_usd else peak_usd, peak_usd if peak_usd else equity_usd),
            self.check_horizon_veto(horizon_veto, horizon_veto_reason),
            self.check_volatility(atr_pct),
            self.check_soft_drawdown(equity_usd if equity_usd else peak_usd, peak_usd if peak_usd else equity_usd),
        ]

        notional_meta = next((c.meta for c in checks if c.code == GuardCode.G08_NOTIONAL.value), {})
        max_notional = float(notional_meta.get("max_notional") or self.cfg.min_notional_usd)

        if profit_validated is False or expected_gross_pct is not None:
            checks.append(
                self.check_profit_validated(
                    proposed_notional or max_notional,
                    None if profit_validated else (expected_gross_pct or 0.0),
                )
            )
        else:
            checks.append(self.check_profit_validated(max_notional))

        if not pre_chain_ok:
            checks.append(
                GuardResult(False, GuardCode.G13_PRE_CHAIN.value, pre_chain_detail or "pre-chain failed")
            )
        else:
            checks.append(GuardResult(True, GuardCode.G13_PRE_CHAIN.value, pre_chain_detail))

        blockers = [c.to_dict() for c in checks if not c.ok]
        ok = len(blockers) == 0

        return {
            "ok": ok,
            "blockers": blockers,
            "passed": [c.to_dict() for c in checks if c.ok],
            "max_notional": max_notional,
            "risk_scale": round(scale, 3),
            "stops_template": self.arm_stops(1.0, max_notional),
            "guards_version": "2.0.0-risk-opt",
        }

    def record_trade_opened(self) -> None:
        self.daily.bump()
        self.save()

    def status(self) -> dict[str, Any]:
        return {
            "daily_trades": self.daily.count_today(),
            "max_trades_per_day": self.cfg.max_trades_per_day,
            "manual_halt": self.manual_halt,
            "manual_halt_reason": self.manual_halt_reason,
            "blocked_until": self.blocked_until,
            "config": asdict(self.cfg),
            "guards_version": "2.0.0-risk-opt",
        }


if __name__ == "__main__":
    g = CircuitGuards()
    r = g.preflight(
        token="WEGLD-bd4d79",
        deployable_usd=50,
        liquidity_usd=100_000,
        hours_since_swap=2.0,
        equity_usd=50,
        peak_usd=50,
        profit_validated=True,
        confidence=0.8,
        strategy="STATARB",
    )
    print(json.dumps(r, indent=2))
    print(json.dumps(g.status(), indent=2))
