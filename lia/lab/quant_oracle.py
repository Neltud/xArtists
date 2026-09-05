"""
LAB — QuantOracle (ops / LIA side).
Adapted from Claude stub: MultiversX first, not Polygon Alchemy.
Whale + hype for paper board — no auto-execution.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

import httpx

Impact = Literal["LOW", "MEDIUM", "HIGH"]
Chain = Literal["multiversx", "solana", "other"]


@dataclass
class WhaleEvent:
    type: str
    asset: str
    value_usd: float
    impact: Impact
    chain: Chain
    at: str


class QuantOracle:
    def __init__(
        self,
        api_base: str = "https://api.multiversx.com",
        watched_tokens: list[str] | None = None,
    ) -> None:
        self.api_base = api_base.rstrip("/")
        self.watched_tokens = watched_tokens or ["TRO-94c925"]

    async def check_whale_transactions(self) -> WhaleEvent | None:
        """
        Demo: one-shot read of token stats.
        Production: webhook (indexer) or logs poll — never busy-loop in hot path.
        """
        token = self.watched_tokens[0]
        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                r = await client.get(f"{self.api_base}/tokens/{token}")
                if r.status_code != 200:
                    return None
                data = r.json()
                tx = int(data.get("transactions") or 0)
                if tx > 10_000:
                    return WhaleEvent(
                        type="LARGE_TRANSFER",
                        asset=token,
                        value_usd=0.0,
                        impact="MEDIUM",
                        chain="multiversx",
                        at=datetime.now(timezone.utc).isoformat(),
                    )
            except Exception:
                return None
        return None

    async def get_hype_score(self, asset_id: str) -> float:
        """0–1 score from on-chain activity; social = Vellum/X (paid, separate)."""
        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                r = await client.get(f"{self.api_base}/tokens/{asset_id}")
                if r.status_code != 200:
                    return 0.5
                data = r.json()
                acc = float(data.get("accounts") or 0)
                tx = float(data.get("transactions") or 0)
                import math

                onchain = min(1.0, math.log10(2 + acc) / 6 + math.log10(2 + tx) / 8)
                social = 0.5  # placeholder
                return round(onchain * 0.65 + social * 0.35, 2)
            except Exception:
                return 0.5


async def _demo() -> None:
    oracle = QuantOracle()
    whale = await oracle.check_whale_transactions()
    hype = await oracle.get_hype_score("TRO-94c925")
    print({"whale": whale, "hype_tro": hype})


if __name__ == "__main__":
    asyncio.run(_demo())
