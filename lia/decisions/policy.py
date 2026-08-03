"""
LIA / Vellum decision processes — risk-tiered gates for long-term dApp ops.
All functions are pure policy: return allow/deny + risk + reason.
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


def evaluate_run_gates(
    *,
    agents_sc: bool = False,
    bid_codehash: bool = False,
    fulfillment: bool = False,
    signature: bool = False,
    micro_trades: bool = False,
    pinata: bool = False,
) -> dict[str, Any]:
    """Single snapshot for Vellum next_run reporting."""
    return {
        "live_trading": risk_live_trading(
            signature_ok=signature, micro_trades_ok=micro_trades
        ).to_dict(),
        "buy_agent": risk_buy_agent(sc_deployed=agents_sc, fulfillment_ready=fulfillment).to_dict(),
        "bid": risk_marketplace_bid(codehash_has_bid=bid_codehash).to_dict(),
        "pinata": Decision(
            pinata,
            "medium" if not pinata else "low",
            "PINATA",
            "JWT configured" if pinata else "Deferred — finish later",
            "export PINATA_JWT in Vellum",
        ).to_dict(),
        "policy_version": "2026-08-03",
    }


if __name__ == "__main__":
    import json

    print(json.dumps(evaluate_run_gates(), indent=2))
