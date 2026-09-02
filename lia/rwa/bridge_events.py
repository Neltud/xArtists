"""Event-driven bridge: TradeSettled → Guardian → openEscrow intent (no PEM)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from lia.guardian.spiral import GuardianVerdict, PolicyLimits, guardian_gate


@dataclass(frozen=True)
class TradeSettled:
    trade_id: str
    pnl_usd: float
    equity_usd: float
    notional_usd: float
    ret_roe: float
    drawdown: float
    compound_intensity: float
    consecutive_wins: int
    mode: str
    # Fraction of positive PnL eligible for Mission RWA bucket (policy)
    rwa_bucket_bps: int = 3000  # 30% default → Mission art


@dataclass(frozen=True)
class EscrowIntent:
    trade_id: str
    amount_usd: float
    meta_hash_hint: str
    reason: str
    guardian: GuardianVerdict
    endpoint: str = "openEscrow"


def plan_rwa_escrow_from_trade(
    event: TradeSettled,
    *,
    seller_hint: str = "",
    meta_hash_hint: str = "",
    policy: Optional[PolicyLimits] = None,
) -> Optional[EscrowIntent]:
    """Return escrow intent only if Guardian allows and PnL > 0.

    Does not sign or send txs — executor / Vellum consumes the intent.
    """
    g = guardian_gate(
        equity=event.equity_usd,
        notional=event.notional_usd,
        ret_roe=event.ret_roe,
        drawdown=event.drawdown,
        compound_intensity=event.compound_intensity,
        consecutive_wins=event.consecutive_wins,
        mode=event.mode,
        policy=policy,
    )
    if not g.allow:
        return EscrowIntent(
            trade_id=event.trade_id,
            amount_usd=0.0,
            meta_hash_hint=meta_hash_hint,
            reason=f"guardian:{g.reason}",
            guardian=g,
            endpoint="",
        )

    if event.pnl_usd <= 0:
        return EscrowIntent(
            trade_id=event.trade_id,
            amount_usd=0.0,
            meta_hash_hint=meta_hash_hint,
            reason="no_positive_pnl",
            guardian=g,
            endpoint="",
        )

    bps = max(0, min(10_000, event.rwa_bucket_bps))
    amount = event.pnl_usd * bps / 10_000.0
    if amount <= 0:
        return None

    return EscrowIntent(
        trade_id=event.trade_id,
        amount_usd=amount,
        meta_hash_hint=meta_hash_hint or f"trade:{event.trade_id}",
        reason="ok",
        guardian=g,
        endpoint="openEscrow",
    )
