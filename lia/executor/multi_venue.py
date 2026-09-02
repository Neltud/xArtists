"""
LIA Multi-Venue Router
======================
Route trade actions to MultiversX / Jupiter (Solana) / Hyperliquid.

Action schema (from brains / guarded_cycle):
  {
    "type": "BUY_SOL" | "SELL_USDC" | "HL_LONG_BTC" | "SWAP" | ...
    "venue": "mvx" | "jupiter" | "hyperliquid" | "auto",
    "token_id" / "coin" / "input_mint" / "output_mint",
    "amount_usd" / "amount" / "size",
    "side": "buy" | "sell",
    "strategy": "STATARB" | ...
    "meta": {...}
  }
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

from lia.executor.hyperliquid_exec import HyperliquidExecutor
from lia.executor.jupiter_solana import JupiterExecutor, resolve_mint
from lia.executor.universal_executor import UniversalExecutor, ExecResult

DEFAULT_VENUE = os.getenv("LIA_DEFAULT_VENUE", "auto")


def infer_venue(action: dict[str, Any]) -> str:
    v = str(action.get("venue") or DEFAULT_VENUE).lower()
    if v in ("mvx", "multiversx", "jupiter", "solana", "hyperliquid", "hl"):
        if v == "solana":
            return "jupiter"
        if v == "hl":
            return "hyperliquid"
        if v == "multiversx":
            return "mvx"
        return v

    t = str(action.get("type") or "").upper()
    token = str(action.get("token_id") or action.get("coin") or action.get("token") or "").upper()

    if t.startswith("HL_") or token in ("BTC", "ETH", "SOL") and "PERP" in t:
        return "hyperliquid"
    if "JUP" in t or token in ("SOL", "BONK") or action.get("input_mint") or action.get("output_mint"):
        return "jupiter"
    if token.startswith("WEGLD") or token.startswith("EGLD") or token.startswith("USDC-C76") or "ERD1" in token:
        return "mvx"
    if token in ("BTC", "ETH") and action.get("size"):
        return "hyperliquid"
    return "mvx"


class MultiVenueExecutor:
    def __init__(self) -> None:
        self.mvx = UniversalExecutor()
        self.jupiter = JupiterExecutor()
        self.hl = HyperliquidExecutor()

    def health(self) -> dict[str, Any]:
        return {
            "mvx": self.mvx.health(),
            "jupiter": self.jupiter.health(),
            "hyperliquid": self.hl.health(),
            "default_venue": DEFAULT_VENUE,
        }

    def execute(self, action: dict[str, Any], *, force_paper: bool = False) -> dict[str, Any]:
        venue = infer_venue(action)
        try:
            if venue == "jupiter":
                return self._exec_jupiter(action, force_paper=force_paper)
            if venue == "hyperliquid":
                return self._exec_hl(action, force_paper=force_paper)
            return self._exec_mvx(action, force_paper=force_paper)
        except Exception as e:
            return {"ok": False, "venue": venue, "error": str(e), "action": action.get("type")}

    def execute_many(
        self, actions: list[dict[str, Any]], *, force_paper: bool = False
    ) -> dict[str, Any]:
        results = [self.execute(a, force_paper=force_paper) for a in actions]
        ok_n = sum(1 for r in results if r.get("ok"))
        return {
            "ok": ok_n == len(results),
            "executed": results,
            "success_count": ok_n,
            "fail_count": len(results) - ok_n,
        }

    def _exec_jupiter(self, action: dict[str, Any], *, force_paper: bool) -> dict[str, Any]:
        input_mint = action.get("input_mint") or action.get("token_in") or "SOL"
        output_mint = action.get("output_mint") or action.get("token_out") or "USDC"
        side = str(action.get("side") or "").lower()
        t = str(action.get("type") or "").upper()

        # BUY token → spend USDC for token; SELL → token for USDC
        if side == "buy" or t.startswith("BUY"):
            input_mint = action.get("input_mint") or "USDC"
            output_mint = action.get("output_mint") or action.get("token_id") or action.get("token") or "SOL"
        elif side == "sell" or t.startswith("SELL"):
            input_mint = action.get("input_mint") or action.get("token_id") or action.get("token") or "SOL"
            output_mint = action.get("output_mint") or "USDC"

        amount = action.get("amount")
        if amount is None:
            # amount_usd approximate: for USDC input use 6 decimals
            usd = float(action.get("amount_usd") or 0)
            in_res = resolve_mint(str(input_mint)).upper()
            if "USDC" in str(input_mint).upper() or in_res.endswith("DT1V"):
                amount = int(usd * 1_000_000)
            else:
                # assume SOL-like 9 decimals if not specified
                amount = int(float(action.get("amount_sol") or 0) * 1_000_000_000) or int(usd * 1e6)

        slip = int(action.get("slippage_bps") or 50)
        res = self.jupiter.execute_swap(
            input_mint=str(input_mint),
            output_mint=str(output_mint),
            amount=int(amount),
            slippage_bps=slip,
            force_paper=force_paper,
        )
        d = res.to_dict()
        d["ok"] = res.ok
        d["action"] = action.get("type")
        d["strategy"] = action.get("strategy")
        return d

    def _exec_hl(self, action: dict[str, Any], *, force_paper: bool) -> dict[str, Any]:
        coin = str(action.get("coin") or action.get("token") or action.get("token_id") or "BTC")
        # strip venue prefixes
        for prefix in ("HL_", "BUY_", "SELL_", "LONG_", "SHORT_"):
            if coin.upper().startswith(prefix):
                coin = coin[len(prefix) :]
        coin = coin.upper().replace("-PERP", "").replace("PERP", "") or "BTC"

        t = str(action.get("type") or "").upper()
        side = str(action.get("side") or "").lower()
        is_buy = side in ("buy", "long") or "BUY" in t or "LONG" in t
        if "SELL" in t or "SHORT" in t:
            is_buy = False

        size = float(action.get("size") or 0)
        if size <= 0 and action.get("amount_usd"):
            mid = self.hl.mid_price(coin) or 0
            if mid > 0:
                size = float(action["amount_usd"]) / mid

        res = self.hl.place_order(
            coin=coin,
            is_buy=is_buy,
            size=size,
            price=float(action["price"]) if action.get("price") is not None else None,
            order_type=str(action.get("order_type") or "limit"),
            tif=str(action.get("tif") or "Gtc"),
            reduce_only=bool(action.get("reduce_only") or False),
            force_paper=force_paper,
        )
        d = res.to_dict()
        d["ok"] = res.ok
        d["action"] = action.get("type")
        d["strategy"] = action.get("strategy")
        d["coin"] = coin
        d["size"] = size
        d["is_buy"] = is_buy
        return d

    def _exec_mvx(self, action: dict[str, Any], *, force_paper: bool) -> dict[str, Any]:
        # Reuse MultiversX dry-run path; live via existing UniversalExecutor
        if force_paper or not getattr(self.mvx, "breaker", None):
            pass
        # Paper envelope for MVX when not live
        from lia.executor import universal_executor as ue

        if force_paper or not ue.LIVE:
            return {
                "ok": True,
                "venue": "mvx",
                "mode": "paper",
                "action": action.get("type"),
                "detail": json.dumps(action),
                "strategy": action.get("strategy"),
            }
        # Live path would need full swap data encoding — return structured intent
        return {
            "ok": True,
            "venue": "mvx",
            "mode": "live-intent",
            "action": action.get("type"),
            "detail": "use nodes/universal_executor or sign_and_send with encoded data",
            "strategy": action.get("strategy"),
        }


if __name__ == "__main__":
    m = MultiVenueExecutor()
    print(json.dumps(m.health(), indent=2))
    print(m.execute({"type": "BUY_SOL", "venue": "jupiter", "amount_usd": 10, "side": "buy"}, force_paper=True))
    print(m.execute({"type": "HL_LONG_BTC", "venue": "hyperliquid", "size": 0.001}, force_paper=True))
