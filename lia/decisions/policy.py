"""
LIA / Vellum decision processes — risk-tiered gates for long-term dApp ops.
All functions are pure policy: return allow/deny + risk + reason.
Guardian spiral + SOL perps + RWA escrow integrated.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, asdict
from typing import Any, Optional


@dataclass
class Decision:
    allow: bool
    risk: str  # low | medium | high | critical
    code: str
    reason: str
    next_action: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def risk_live_trading(
    *,
    lia_live: Optional[bool] = None,
    executor_halted: bool = False,
    agents_sc_deployed: bool = False,
    signature_ok: bool = False,
    micro_trades_ok: bool = False,
) -> Decision:
    live = lia_live if lia_live is not None else os.environ.get("LIA_LIVE_TRADING", "0") == "1"
    if executor_halted:
        return Decision(False, "critical", "HALT", "Circuit breaker halted", "reset after review")
    if not live:
        return Decision(True, "low", "PAPER", "Paper mode — no capital risk", "keep publishing board")
    if not signature_ok or not micro_trades_ok:
        return Decision(
            False,
            "critical",
            "LIVE_BLOCKED",
            "Live requested but signature/micro-trades not validated",
            "complete blackbox user TX first",
        )
    return Decision(True, "high", "LIVE_OK", "Live trading allowed under risk limits", "enforce max_trades/day")


def risk_buy_agent(*, sc_deployed: bool, fulfillment_ready: bool) -> Decision:
    if not sc_deployed:
        return Decision(False, "low", "SC_NULL", "agents_marketplace null — UI must block", "deploy SC")
    if not fulfillment_ready:
        return Decision(
            False,
            "high",
            "NO_FULFILL",
            "Would take user EGLD without API key/badge pipeline",
            "enable lia.agents.fulfillment watcher",
        )
    return Decision(True, "medium", "BUY_OK", "Buy agent allowed", "confirm tx then fulfill")


def risk_marketplace_bid(*, codehash_has_bid: bool) -> Decision:
    if not codehash_has_bid:
        return Decision(
            False,
            "high",
            "NO_BID_ENDPOINT",
            "Live SC may lack placeBid — do not advertise bid",
            "redeploy or hide Bid UI",
        )
    return Decision(True, "medium", "BID_OK", "Bid endpoints present", "test withdraw/accept")


def risk_tro_reward(
    *,
    pool_remaining: float,
    is_physical: bool,
    mode: str = "standard",
    trigger: str = "first_sale",
) -> Decision:
    if pool_remaining <= 0:
        return Decision(False, "low", "POOL_EMPTY", "No TRO left in incentives pool", "refill from fees policy")
    if mode == "standard" and not is_physical:
        return Decision(False, "low", "DIGITAL_SKIP", "Standard mode physical only", "")
    if trigger != "first_sale" and trigger != "first_physical_mint":
        return Decision(False, "medium", "BAD_TRIGGER", "Unexpected trigger", "use locked triggers")
    return Decision(True, "medium", "REWARD_OK", f"Queue reward ({trigger})", "paper unless TRO_REWARDS_LIVE")


def risk_mint_uri(*, uri: str) -> Decision:
    u = (uri or "").strip().lower()
    if not u:
        return Decision(False, "high", "NO_URI", "Mint without media URI", "pin IPFS first")
    if u.startswith("ipfs://") or "/ipfs/" in u:
        return Decision(True, "low", "IPFS_OK", "IPFS URI", "ensure pin active (Pinata later)")
    if "youtube" in u or "youtu.be" in u:
        return Decision(
            False,
            "high",
            "YT_NOT_MEDIA",
            "YouTube cannot be primary NFT media",
            "pin file IPFS; YT external only",
        )
    return Decision(True, "medium", "HTTP_URI", "Centralized HTTP media", "prefer ipfs:// for LT")


def risk_dao_vote_button(*, send_tx_ready: bool, vote_abi_ready: bool) -> Decision:
    if not send_tx_ready or not vote_abi_ready:
        return Decision(
            False,
            "medium",
            "UI_ONLY",
            "Show proposals read-only — no fake vote button",
            "wire ABI + sdk-dapp before enabling",
        )
    return Decision(True, "high", "VOTE_LIVE", "On-chain vote", "test on small proposal")


def risk_guardian_compound(
    *,
    equity_usd: float,
    notional_usd: float,
    ret_roe: float = 0.0,
    drawdown: float = 0.0,
    compound_intensity: float = 0.0,
    consecutive_wins: int = 0,
    mode: str = "COMPOUND",
) -> Decision:
    """Policy wrapper around lia.guardian.spiral.guardian_gate."""
    try:
        from lia.guardian.spiral import guardian_gate

        v = guardian_gate(
            equity=equity_usd,
            notional=notional_usd,
            ret_roe=ret_roe,
            drawdown=drawdown,
            compound_intensity=compound_intensity,
            consecutive_wins=consecutive_wins,
            mode=mode,
        )
        if not v.allow:
            risk = "critical" if v.reason in ("spiral_score", "leverage_cap") else "high"
            return Decision(
                False,
                risk,
                f"GUARDIAN_{v.reason.upper()}",
                f"Guardian blocked: {v.reason} (spiral={v.spiral_score:.3f} lev={v.effective_leverage:.2f})",
                "reduce size / wait DEFENSE clear",
            )
        return Decision(
            True,
            "medium",
            "GUARDIAN_OK",
            f"max_notional={v.max_notional:.2f}",
            "proceed under max_notional",
        )
    except Exception as e:
        return Decision(False, "critical", "GUARDIAN_ERR", str(e), "fix import / inputs")


def risk_sol_perps(*, live: bool, leverage: float) -> Decision:
    try:
        from lia.guardian.spiral import sol_perps_allowed

        v = sol_perps_allowed(live=live, requested_leverage=leverage)
        if not v.allow:
            return Decision(
                False,
                "critical",
                "SOL_LEV_BLOCK",
                v.reason,
                "signals-only or lev ≤ 1.5 live",
            )
        if v.reason == "sol_paper_high_lev_ok":
            return Decision(True, "high", "SOL_PAPER_HIGH_LEV", v.reason, "never promote to live as-is")
        return Decision(True, "medium", "SOL_OK", v.reason, "")
    except Exception as e:
        return Decision(False, "critical", "SOL_ERR", str(e), "")


def risk_rwa_escrow(
    *,
    guardian_allow: bool,
    pnl_usd: float,
    sc_deployed: bool = False,
) -> Decision:
    if not guardian_allow:
        return Decision(False, "high", "RWA_GUARDIAN", "Guardian deny — no escrow intent", "")
    if pnl_usd <= 0:
        return Decision(False, "low", "RWA_NO_PNL", "No positive PnL for Mission bucket", "")
    if not sc_deployed:
        return Decision(
            True,
            "medium",
            "RWA_INTENT_ONLY",
            "Journal EscrowIntent only — rwa-escrow-bridge not deployed",
            "deploy after market SC; do not send funds to null",
        )
    return Decision(True, "high", "RWA_OPEN_OK", "May call openEscrow", "meta_hash + deadline required")


def evaluate_run_gates(
    *,
    agents_sc: bool = False,
    bid_codehash: bool = False,
    fulfillment: bool = False,
    signature: bool = False,
    micro_trades: bool = False,
    pinata: bool = False,
    rwa_sc: bool = False,
) -> dict[str, Any]:
    """Single snapshot for Vellum next_run reporting."""
    return {
        "live_trading": risk_live_trading(
            signature_ok=signature, micro_trades_ok=micro_trades
        ).to_dict(),
        "buy_agent": risk_buy_agent(sc_deployed=agents_sc, fulfillment_ready=fulfillment).to_dict(),
        "bid": risk_marketplace_bid(codehash_has_bid=bid_codehash).to_dict(),
        "guardian_sample": risk_guardian_compound(
            equity_usd=100, notional_usd=50, compound_intensity=0.2
        ).to_dict(),
        "sol_live_15x": risk_sol_perps(live=True, leverage=15.0).to_dict(),
        "rwa": risk_rwa_escrow(guardian_allow=True, pnl_usd=1.0, sc_deployed=rwa_sc).to_dict(),
        "pinata": Decision(
            pinata,
            "medium" if not pinata else "low",
            "PINATA",
            "JWT configured" if pinata else "Deferred — finish later",
            "export PINATA_JWT in Vellum",
        ).to_dict(),
        "policy_version": "2026-08-08",
    }


if __name__ == "__main__":
    import json

    print(json.dumps(evaluate_run_gates(), indent=2))
