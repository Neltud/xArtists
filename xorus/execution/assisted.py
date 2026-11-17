"""Assisted (human-in-the-loop) swap flow via OneDex MCP.

Never signs. Never holds keys. Returns a signing link + simulation result.
"""
from __future__ import annotations

from typing import Any, Optional

from xorus.execution import onedex_client as client
from xorus.execution.policy import check_intent
from xorus.execution.types import (
    AssistedOutcome,
    BuildResult,
    QuoteResult,
    SimulationResult,
    SwapIntent,
)


def _extract_min_out(data: dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
    """Best-effort extraction of human + raw minOut."""
    min_out = None
    min_out_raw = None
    if "minOut" in data:
        mo = data["minOut"]
        if isinstance(mo, dict):
            min_out = mo.get("human") or mo.get("amount") or str(mo)
            min_out_raw = mo.get("raw") or mo.get("amountRaw")
        else:
            min_out = str(mo)
    if "minOutRaw" in data:
        min_out_raw = str(data["minOutRaw"])
    return min_out, min_out_raw


def run_assisted(intent: SwapIntent, *, skip_quote: bool = False) -> AssistedOutcome:
    """
    Full assisted path:
      policy → quote (optional) → build → simulate → ready_to_sign | blocked
    """
    # 1. Policy
    decision = check_intent(intent)
    if not decision.allowed:
        return AssistedOutcome(
            stage="blocked",
            intent=intent,
            message=f"Policy rejected: {decision.reason}",
        )

    quote_result: Optional[QuoteResult] = None

    # 2. Quote (recommended)
    if not skip_quote:
        try:
            raw_q = client.get_quote(
                intent.token_in,
                intent.token_out,
                intent.amount_in,
                confirm_high_slippage=intent.confirm_high_slippage,
                confirm_high_impact=intent.confirm_high_impact,
            )
            mo, mor = _extract_min_out(raw_q)
            quote_result = QuoteResult(
                ok=True,
                quoted_out=str(raw_q.get("quotedOut") or raw_q.get("amountOut") or ""),
                min_out=mo,
                min_out_raw=mor,
                cost_summary=str(raw_q.get("costSummary") or raw_q.get("costs") or ""),
                price_impact=str(raw_q.get("priceImpact") or ""),
                route=str(raw_q.get("route") or ""),
                warnings=list(raw_q.get("warnings") or []),
                raw=raw_q,
            )
        except Exception as e:
            return AssistedOutcome(
                stage="quote",
                intent=intent,
                message=f"Quote failed: {e}",
            )

    # 3. Build unsigned tx
    try:
        raw_b = client.build_swap_tx(
            intent.token_in,
            intent.token_out,
            intent.amount_in,
            intent.sender,
            confirm_high_slippage=intent.confirm_high_slippage,
            confirm_high_impact=intent.confirm_high_impact,
        )
        mo, mor = _extract_min_out(raw_b)
        build_result = BuildResult(
            ok=True,
            transaction=raw_b.get("transaction"),
            summary=str(raw_b.get("summary") or ""),
            signing_link=raw_b.get("signingLink"),
            expires_at=raw_b.get("expiresAt"),
            min_out=mo,
            min_out_raw=mor,
            raw=raw_b,
        )
    except Exception as e:
        return AssistedOutcome(
            stage="build",
            intent=intent,
            quote=quote_result,
            build=BuildResult(ok=False, error=str(e)),
            message=f"Build failed: {e}",
        )

    if not build_result.transaction:
        return AssistedOutcome(
            stage="build",
            intent=intent,
            quote=quote_result,
            build=build_result,
            message="No transaction returned by build_swap_tx",
        )

    # 4. Simulate (mandatory)
    try:
        raw_s = client.simulate_swap_tx(
            build_result.transaction,
            min_out_raw=build_result.min_out_raw,
        )
        status = str(raw_s.get("status") or "").lower()
        meets = raw_s.get("meetsMinOut")
        if meets == "—":
            meets_bool = None
        else:
            meets_bool = bool(meets) if meets is not None else None

        sim = SimulationResult(
            ok=status in ("success", "ok"),
            status=status,
            meets_min_out=meets_bool,
            raw=raw_s,
        )
    except Exception as e:
        return AssistedOutcome(
            stage="simulate",
            intent=intent,
            quote=quote_result,
            build=build_result,
            simulation=SimulationResult(ok=False, error=str(e)),
            message=f"Simulation failed: {e}",
        )

    # Strict: require status OK AND meets_min_out explicitly True (audit 2026-11-17)
    if not sim.ok or sim.meets_min_out is not True:
        return AssistedOutcome(
            stage="simulate",
            intent=intent,
            quote=quote_result,
            build=build_result,
            simulation=sim,
            message="Simulation did not pass (status or minOut inconclusive/failed). Do not sign.",
        )

    # 5. Ready for human signature
    link = build_result.signing_link or "(no signingLink — use the unsigned transaction in a wallet)"
    return AssistedOutcome(
        stage="ready_to_sign",
        intent=intent,
        quote=quote_result,
        build=build_result,
        simulation=sim,
        message=(
            f"Ready. Open the signing link, verify receiver + amounts, then sign.\n"
            f"signingLink: {link}\n"
            f"minOut: {build_result.min_out}"
        ),
        requires_human_signature=True,
    )
