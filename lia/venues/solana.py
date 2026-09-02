"""
Solana venue stubs — Jupiter quotes (read-only) when enabled.
No Solana wallet in LIA executor yet → signals only, status planned.
"""
from __future__ import annotations

import json
import urllib.request
from typing import Any, Optional

from lia.circuit.strategies import Signal

JUP_QUOTE = "https://quote-api.jup.ag/v6/quote"


def jupiter_quote(
    *,
    input_mint: str,
    output_mint: str,
    amount: int,
    slippage_bps: int = 50,
) -> Optional[dict[str, Any]]:
    """Fetch Jupiter route quote. Returns None on failure."""
    url = (
        f"{JUP_QUOTE}?inputMint={input_mint}&outputMint={output_mint}"
        f"&amount={amount}&slippageBps={slippage_bps}"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None


def jupiter_edge_signal(
    *,
    token_label: str = "SOL",
    expected_out: float,
    quoted_out: float,
    min_edge_pct: float = 0.004,
) -> Signal:
    """
    Compare expected vs quoted out amount (caller supplies both).
    Positive edge → BUY-style signal for research; not executable until SOL adapter.
    """
    if expected_out <= 0 or quoted_out <= 0:
        return Signal("WAIT", token_label, 0.2, "JUP", "bad quote", meta={"venue": "jupiter"})
    edge = (quoted_out - expected_out) / expected_out
    if edge >= min_edge_pct:
        return Signal(
            "BUY",
            token_label,
            min(0.8, 0.5 + edge * 5),
            "JUP",
            f"jupiter edge={edge:.3%}",
            meta={"venue": "jupiter", "chain": "solana", "executable": False},
        )
    return Signal(
        "WAIT",
        token_label,
        0.35,
        "JUP",
        f"edge={edge:.3%} < {min_edge_pct:.3%}",
        meta={"venue": "jupiter", "executable": False},
    )
