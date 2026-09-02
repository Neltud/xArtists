"""ESDT trading universe — liquid ESDT buy/sell/TP with oracle + liquidity gates."""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "data" / "oracle_config.json"
DENY_DEFAULT = set(os.getenv("ESDT_DENY", "TRO-94c925").split(","))


@dataclass
class TokenGate:
    token_id: str
    allowed: bool
    tier: str
    reason: str
    price_usd: float = 0.0
    liquidity_usd: float = 0.0


def load_tokens() -> dict[str, str]:
    if CONFIG.exists():
        try:
            return dict(json.loads(CONFIG.read_text(encoding="utf-8")).get("tokens") or {})
        except Exception:
            pass
    return {
        "WEGLD": "WEGLD-bd4d79",
        "USDC": "USDC-c76f1f",
        "MEX": "MEX-455c57",
        "TRO": "TRO-94c925",
    }


def classify(
    token_id: str,
    *,
    price_usd: float = 0.0,
    liquidity_usd: float = 0.0,
    live: bool = False,
) -> TokenGate:
    tid = token_id.strip()
    if not tid or "-" not in tid:
        return TokenGate(tid, False, "deny", "invalid token id")
    if tid in DENY_DEFAULT and not os.getenv("ESDT_ALLOW_TRO"):
        return TokenGate(tid, False, "deny", "denylist / illiquid utility (TRO)", price_usd, liquidity_usd)
    core = {"WEGLD-bd4d79", "USDC-c76f1f", "USDT-f8cf68", "MEX-455c57"}
    if tid in core and price_usd > 0:
        return TokenGate(tid, True, "core", "core liquid ESDT", price_usd, liquidity_usd)
    if price_usd <= 0:
        return TokenGate(
            tid, not live, "speculative",
            "no oracle price — paper only" if live else "no oracle price",
            price_usd, liquidity_usd,
        )
    floor = float(os.getenv("ESDT_LIQ_FLOOR_USD", "25000"))
    if liquidity_usd >= floor:
        return TokenGate(tid, True, "liquid", f"liq≥{floor}", price_usd, liquidity_usd)
    if liquidity_usd >= floor * 0.2:
        return TokenGate(
            tid, not live or os.getenv("ESDT_ALLOW_THIN") == "1", "speculative",
            "thin liquidity", price_usd, liquidity_usd,
        )
    return TokenGate(
        tid, not live, "speculative",
        "very thin — paper only unless ESDT_ALLOW_THIN", price_usd, liquidity_usd,
    )


def gate_from_oracle(token_id: str, *, live: bool = False) -> TokenGate:
    price = 0.0
    try:
        from lia.oracles.price_oracle import fetch_token_usd
        price = float(fetch_token_usd(token_id) or 0)
    except Exception:
        pass
    return classify(token_id, price_usd=price, liquidity_usd=0.0, live=live)


def universe_snapshot(*, live: bool = False) -> dict[str, Any]:
    rows = []
    for ticker, tid in load_tokens().items():
        g = gate_from_oracle(tid, live=live)
        rows.append({"ticker": ticker, **asdict(g)})
    return {
        "live": live,
        "n": len(rows),
        "allowed": sum(1 for r in rows if r["allowed"]),
        "tokens": rows,
        "policy": "any ESDT with oracle+liq gates; TRO deny default",
    }


if __name__ == "__main__":
    print(json.dumps(universe_snapshot(live=False), indent=2))
